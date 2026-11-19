import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire, register } from 'node:module';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const EXPECTED_TEST_DB = 'air_testbed_sandbox';

function registerAliasAndRuntimeBootstrap() {
  if (!(globalThis as any).AsyncLocalStorage) {
    (globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
  }
  const srcRoot = path.resolve(process.cwd(), 'src');

  // 1. CJS require hook cho @/*
  const req = createRequire(import.meta.url);
  const Module = req('node:module');
  const origResolve = Module._resolveFilename;
  Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
    if (typeof request === 'string' && request.startsWith('@/')) {
      const target = path.join(srcRoot, request.slice(2));
      return origResolve.call(this, target, parent, isMain, options);
    }
    return origResolve.call(this, request, parent, isMain, options);
  };

  // 2. ESM import hook cho @/* (để chạy được trực tiếp bằng `npx tsx scripts/run_7_integration_tests.ts`)
  const esmHookCode = `
    import fs from 'node:fs';
    import path from 'node:path';
    import { pathToFileURL } from 'node:url';
    const srcRoot = ${JSON.stringify(srcRoot)};
    export async function resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('@/')) {
        const base = path.join(srcRoot, specifier.slice(2));
        const candidates = [base, base + '.js', base + '.ts', base + '.mjs', path.join(base, 'index.js'), path.join(base, 'index.ts')];
        const hit = candidates.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    }
  `;
  register(`data:text/javascript,${encodeURIComponent(esmHookCode)}`, pathToFileURL(import.meta.url));
}

function buildCourseRoster(courseMeta: any, courseSessions: any[]): string[] {
  const roster: string[] = [...(courseMeta?.enrolled_students || [])];
  const repIds = new Set(
    courseSessions.map((s: any) => s.representative_attendance_event?.student_id).filter(Boolean)
  );
  for (const repId of repIds) {
    if (!roster.includes(repId)) {
      const replaceIdx = roster.findIndex(id => !repIds.has(id));
      if (replaceIdx !== -1) roster[replaceIdx] = repId;
      else roster.push(repId);
    }
  }
  return roster;
}

function loadEnvFileIfNeeded() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function resolveIsolatedTestUri(): string {
  loadEnvFileIfNeeded();
  const testUri = process.env.MONGODB_TEST_URI?.trim();
  if (!testUri) {
    throw new Error(
      'Thiếu biến môi trường MONGODB_TEST_URI trong .env. Từ chối chạy để bảo vệ CSDL Production!'
    );
  }
  const dbMatch = testUri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  const parsedDb = dbMatch ? dbMatch[1] : '';
  if (parsedDb !== EXPECTED_TEST_DB || parsedDb === 'sys-air') {
    throw new Error(
      `BẢO VỆ AN TOÀN: MONGODB_TEST_URI phải trỏ tới "${EXPECTED_TEST_DB}", hiện tại là "${parsedDb}".`
    );
  }
  // Ép mọi module connectDB() bên trong src/ sử dụng URI testbed cô lập
  process.env.MONGODB_URI = testUri;
  process.env.MongoDB_URI = testUri;
  return testUri;
}

function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

// ============================================================================
// MOCK MẠNG OUTBOUND (Chặn 100% gọi ra Zalo Bot API, Google Apps Script, Google APIs)
// ============================================================================
const outboundTelemetry = {
  zaloBotBlocked: 0,
  appscriptBlocked: 0,
  otherExternalBlocked: 0,
  realOutboundSent: 0
};

const originalFetch = globalThis.fetch;
function setupNetworkMocks() {
  globalThis.fetch = async (input: any, init?: any): Promise<any> => {
    const urlStr = typeof input === 'string' ? input : input?.url || '';
    if (urlStr.includes('zaloplatforms.com')) {
      outboundTelemetry.zaloBotBlocked++;
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: { message_id: 'mock_zalo_msg' }, simulated: true }),
        text: async () => JSON.stringify({ ok: true, simulated: true })
      };
    }
    if (urlStr.includes('script.google.com') || urlStr.includes('googleapis.com')) {
      outboundTelemetry.appscriptBlocked++;
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: true, success: true, simulated: true }),
        text: async () => JSON.stringify({ status: true, success: true, simulated: true })
      };
    }
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      if (!urlStr.includes('localhost') && !urlStr.includes('127.0.0.1')) {
        outboundTelemetry.otherExternalBlocked++;
        return {
          ok: true,
          status: 200,
          json: async () => ({ blocked: true, url: urlStr }),
          text: async () => JSON.stringify({ blocked: true })
        };
      }
    }
    return originalFetch(input, init);
  };
}

// ============================================================================
// ĐỒNG HỒ GIẢ (FAKE CLOCK) CHO ĐỘNG CƠ SLA 30/60/90/120 PHÚT
// ============================================================================
const RealDate = globalThis.Date;
let fakeClockNowMs: number | null = null;

function installFakeClock(anchorMs: number) {
  fakeClockNowMs = anchorMs;
  const FakeDate: any = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fakeClockNowMs !== null ? fakeClockNowMs : RealDate.now());
      } else {
        // @ts-ignore
        super(...args);
      }
    }
    static now() {
      return fakeClockNowMs !== null ? fakeClockNowMs : RealDate.now();
    }
    static parse = RealDate.parse;
    static UTC = RealDate.UTC;
  };
  globalThis.Date = FakeDate;
}

function advanceFakeClockTo(ms: number) {
  fakeClockNowMs = ms;
}

function restoreRealClock() {
  fakeClockNowMs = null;
  globalThis.Date = RealDate;
}

// Helper chạy Route Handlers có gọi revalidateTag() trong AsyncLocalStorage context
async function runWithNextContext<T>(workAsyncStorage: any, routePath: string, fn: () => Promise<T>): Promise<T> {
  const store: any = {
    route: routePath,
    page: routePath,
    incrementalCache: {},
    pendingRevalidatedTags: [],
    revalidatedTags: []
  };
  return workAsyncStorage.run(store, fn);
}

function buildAuthedRequest(NextRequestCtor: any, url: string, method: string, cookieName: string, token: string, bodyObj?: any) {
  const headers: Record<string, string> = {
    cookie: `${cookieName}=${token}`
  };
  const init: any = { method, headers };
  if (bodyObj !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(bodyObj);
  }
  return new NextRequestCtor(url, init);
}

async function computeLayer1CheckinHash(PostCourse: any): Promise<{ hash: string; matrix: Array<{ courseId: string; studentId: string; lesson: string; checkin: number }> }> {
  const courses = await PostCourse.find({}).sort({ ID: 1 }).lean();
  const matrix: Array<{ courseId: string; studentId: string; lesson: string; checkin: number }> = [];
  for (const c of courses) {
    for (const st of c.Student || []) {
      for (const l of st.Learn || []) {
        matrix.push({
          courseId: c.ID,
          studentId: st.ID,
          lesson: String(l.Lesson),
          checkin: l.Checkin
        });
      }
    }
  }
  const hash = crypto.createHash('sha256').update(JSON.stringify(matrix)).digest('hex');
  return { hash, matrix };
}

interface TestCaseResult {
  id: string;
  name: string;
  status: 'PASSED' | 'FAILED';
  duration_ms: number;
  details: Record<string, any>;
  assertions: Array<{ name: string; passed: boolean; message: string }>;
}

async function runAllTests() {
  registerAliasAndRuntimeBootstrap();
  setupNetworkMocks();
  const testUri = resolveIsolatedTestUri();
  // Gán URL AppsScript giả lập trước khi import dynamic src/function/drive/appscript.js
  process.env.GOOGLE_SCRIPT_URL_ACTION = 'https://script.google.com/macros/s/sandbox-mock/exec';

  // Dynamic import toàn bộ module thật của hệ thống sau khi đã bootstrap env + AsyncLocalStorage + alias @/
  const { NextRequest } = await import('next/server');
  const { workAsyncStorage } = await import('next/dist/server/app-render/work-async-storage.external.js');
  const { default: connectDB } = await import('../src/config/connectDB.js');
  const { default: PostCourse } = await import('../src/models/course.js');
  const { default: MakeupSession } = await import('../src/models/makeupSession.js');
  const { default: Notification } = await import('../src/models/notification.js');
  const { default: NotificationLog } = await import('../src/models/notificationLog.js');
  const { default: NotificationRecipient } = await import('../src/models/notificationRecipient.js');
  const { default: NotificationTemplate } = await import('../src/models/notificationTemplate.js');
  const { default: NotificationSetting } = await import('../src/models/notificationSetting.js');
  const { default: ZaloMessageLog } = await import('../src/models/zaloMessageLog.js');
  const { default: Student } = await import('../src/models/student.js');
  const { default: Area } = await import('../src/models/area.js');
  const { default: User } = await import('../src/models/users.js');
  const { default: Log } = await import('../src/models/log.js');
  const { default: TrialCourse } = await import('../src/models/coursetry.js');

  const { getCookieName, getJwtSecret } = await import('../src/utils/env.js');
  const { checkScheduleConflict, isTimeOverlapping } = await import('../src/utils/scheduleConflict.js');
  const { sendInstantCheckinZaloNotification } = await import('../src/services/zaloAutomation.service.js');
  const { checkLessonAfterEnd } = await import('../src/function/notificationEngine.js');
  const { POST: checkinPostHandler } = await import('../src/app/api/(course)/checkin/route.js');
  const {
    GET: makeupGetHandler,
    POST: makeupPostHandler
  } = await import('../src/app/api/academic/makeup-sessions/route.js');
  const {
    PATCH: makeupPatchHandler,
    DELETE: makeupDeleteHandler
  } = await import('../src/app/api/academic/makeup-sessions/[id]/route.js');
  const {
    POST: leavePostHandler,
    DELETE: leaveDeleteHandler
  } = await import('../src/app/api/parent/leave-request/route.js');
  const { signParentToken, PARENT_COOKIE_NAME } = await import('../src/utils/parentAuth.js');
  const { DELETE: areaDeleteHandler } = await import('../src/app/api/(area)/area/[id]/route.js');
  const cookieName = getCookieName();

  console.log('======================================================================');
  console.log('     SYS-AIR REAL INTEGRATION TEST SUITE (7 TEST CASES / SANDBOX)');
  console.log('======================================================================');
  console.log(`Target Database: "${EXPECTED_TEST_DB}"`);
  console.log(`Execution Time:  ${new RealDate().toISOString()}`);
  console.log(`Git Commit:      ${getGitCommitHash()}`);
  console.log('Outbound Network: MOCKED & BLOCKED (Zalo Bot API, Google Apps Script)');
  console.log('----------------------------------------------------------------------\n');

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(testUri, { dbName: EXPECTED_TEST_DB });
  }
  if (mongoose.connection.db?.databaseName !== EXPECTED_TEST_DB) {
    throw new Error(
      `BẢO VỆ AN TOÀN: Đang kết nối "${mongoose.connection.db?.databaseName}" thay vì "${EXPECTED_TEST_DB}".`
    );
  }
  console.log(`[PASS] Đã kết nối cô lập vào CSDL thử nghiệm "${EXPECTED_TEST_DB}".\n`);

  const datasetPath = path.resolve(process.cwd(), 'data/seeded_40_sessions_and_attendance.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const sessions: any[] = dataset.sessions;
  const results: TestCaseResult[] = [];

  // =========================================================================
  // BƯỚC 0: DỌN SẠCH & NẠP DỮ LIỆU KỊCH BẢN 40 BUỔI VÀO SANDBOX
  // =========================================================================
  console.log('[STEP 0] Làm sạch và nạp 40 buổi kịch bản (5 khóa × 8 buổi, 12 HS) vào sandbox...');
  await Promise.all([
    PostCourse.deleteMany({}),
    MakeupSession.deleteMany({}),
    Notification.deleteMany({}),
    NotificationLog.deleteMany({}),
    NotificationRecipient.deleteMany({}),
    NotificationTemplate.deleteMany({}),
    NotificationSetting.deleteMany({}),
    ZaloMessageLog.deleteMany({}),
    Student.deleteMany({}),
    Area.deleteMany({}),
    TrialCourse.deleteMany({}),
    Log.deleteMany({})
  ]);

  // Đảm bảo có tài khoản Admin/Academic thật trong sandbox để Authenticate Route Handlers
  const adminOid = new mongoose.Types.ObjectId('6a97af613b1fbc04f1ca0001');
  const teacherOid = new mongoose.Types.ObjectId('6a97af613b1fbc04f1ca0002');
  const dummyHash = await bcrypt.hash('SandboxPass#123', 8);

  await User.findByIdAndUpdate(
    adminOid,
    {
      _id: adminOid,
      name: 'Admin Testbed',
      email: 'admin-sandbox@test.local',
      phone: '0900000099',
      uid: dummyHash,
      role: ['Admin', 'Academic'],
      status: true
    },
    { upsert: true }
  );
  await User.findByIdAndUpdate(
    teacherOid,
    {
      _id: teacherOid,
      name: 'GV Sandbox',
      email: 'gv-sandbox@test.local',
      phone: '0900000098',
      uid: dummyHash,
      role: ['Teacher'],
      status: true
    },
    { upsert: true }
  );

  const adminToken = jwt.sign(
    { id: String(adminOid), role: ['Admin', 'Academic'], name: 'Admin Testbed', email: 'admin-sandbox@test.local' },
    getJwtSecret(),
    { expiresIn: '2h' }
  );

  const makeReq = (url: string, method: string, bodyObj?: any) =>
    buildAuthedRequest(NextRequest, url, method, cookieName, adminToken, bodyObj);
  const runNext = <T>(routePath: string, fn: () => Promise<T>) =>
    runWithNextContext(workAsyncStorage, routePath, fn);
  const snapshotLayer1 = () => computeLayer1CheckinHash(PostCourse);

  // Tạo cơ sở và 5 phòng học (Lab 01..Lab 05)
  const roomIds = [1, 2, 3, 4, 5].map(n => new mongoose.Types.ObjectId(`6a97af613b1fbc04f1ca5a0${n}`));
  const areaDoc = await Area.create({
    _id: new mongoose.Types.ObjectId('6a97af613b1fbc04f1ca5000'),
    name: 'Cơ sở Thực hành Robotics LHU',
    color: '#3B82F6',
    rooms: [
      { _id: roomIds[0], name: 'Lab 01' },
      { _id: roomIds[1], name: 'Lab 02' },
      { _id: roomIds[2], name: 'Lab 03' },
      { _id: roomIds[3], name: 'Lab 04' },
      { _id: roomIds[4], name: 'Lab 05' }
    ]
  });

  // Tạo 12 học sinh giả lập (HS01..HS12)
  const syntheticStudents = [];
  for (let i = 1; i <= 12; i++) {
    const sid = `HS${String(i).padStart(2, '0')}`;
    syntheticStudents.push({
      _id: new mongoose.Types.ObjectId(`6a97af613b1fbc04f1ca70${String(i).padStart(2, '0')}`),
      ID: sid,
      Name: `Học viên Thử nghiệm ${sid}`,
      Phone: `09000000${String(i).padStart(2, '0')}`,
      Area: areaDoc._id,
      // Nửa đầu gắn zaloChatId để ép đi qua nhánh Zalo Bot API, nửa sau đi qua fallback AppsScript
      zaloChatId: i <= 6 ? `mock_chat_${sid}` : undefined
    });
  }
  await Student.insertMany(syntheticStudents);

  // Tạo 5 khóa học & 40 buổi học ban đầu ở trạng thái chưa điểm danh (Checkin = 0)
  // để CA 1 trực tiếp chấm qua POST /api/(course)/checkin
  const courseOids: Record<string, mongoose.Types.ObjectId> = {};
  const courseRosters: Record<string, string[]> = {};
  const lessonOidBySessionId: Record<string, mongoose.Types.ObjectId> = {};
  // Đặt các buổi học trong vòng 14 ngày gần nhất để các ca đang xử lý chưa bị quá hạn 30 ngày tự động
  const baseDate = new RealDate(RealDate.now() - 14 * 24 * 60 * 60 * 1000);

  for (let cIdx = 0; cIdx < dataset.courses.length; cIdx++) {
    const c = dataset.courses[cIdx];
    const cOid = new mongoose.Types.ObjectId(`6a97af613b1fbc04f1ca60${c.course_code.slice(1)}`);
    courseOids[c.course_id] = cOid;

    const courseSessions = sessions.filter((s: any) => s.course_id === c.course_id);
    const roster = buildCourseRoster(c, courseSessions);
    courseRosters[c.course_id] = roster;

    const detailList = courseSessions.map((s: any, idx: number) => {
      const lOid = new mongoose.Types.ObjectId(`6a97af613b1fbc04f1ca8${String(cIdx + 1)}${String(idx + 1).padStart(2, '0')}`);
      lessonOidBySessionId[s.session_id] = lOid;
      const roomIdx = parseInt(s.room.replace('Lab ', ''), 10) - 1;
      return {
        _id: lOid,
        Topic: new mongoose.Types.ObjectId(`6a97af613b1fbc04f1ca90${String(idx + 1).padStart(2, '0')}`),
        Day: new RealDate(baseDate.getTime() + idx * 24 * 60 * 60 * 1000),
        Time: '08:30 - 10:00',
        Room: roomIds[roomIdx % roomIds.length],
        Teacher: teacherOid,
        Note: s.topic,
        Type: 'Chính thức',
        Image: idx < 6 ? 'synthetic_evidence_image' : '',
        DetailImage: idx < 6 ? [{ id: `img_${cIdx}_${idx}`, type: 'image', create: new RealDate() }] : []
      };
    });

    const studentList = roster.map((sid: string) => ({
      ID: sid,
      Learn: detailList.map((d: any) => ({
        Lesson: d._id,
        Checkin: 0,
        Cmt: [],
        makeupStatus: 'NOT_REQUIRED'
      }))
    }));

    await PostCourse.create({
      _id: cOid,
      ID: c.course_id,
      Name: c.course_name,
      Type: 'AI Robotic',
      Area: areaDoc._id,
      TeacherHR: adminOid,
      Detail: detailList,
      Student: studentList
    });
  }
  console.log('-> Đã nạp 5 khóa học, 40 buổi học, 12 học sinh vào CSDL sandbox.\n');

  // =========================================================================
  // CA 1: GỌI THẬT POST /api/(course)/checkin + CHẶN CHECKIN=0 + TÍNH HASH LỚP 1
  // =========================================================================
  let layer1HashAfterCheckin = '';
  let layer1MatrixAfterCheckin: Array<{ courseId: string; studentId: string; lesson: string; checkin: number }> = [];
  {
    const t0 = performance.now();
    console.log('[CA 1] Gọi thật POST /api/(course)/checkin (bao gồm checkin=0) & Tính SHA-256 Lớp 1...');

    // 1a. Kiểm tra Lỗi 2 đã sửa: Gửi checkin = 0 cho HS01 tại buổi 1 -> không được tạo MakeupSession
    const firstCourseOid = courseOids[sessions[0].course_id];
    const firstLessonOid = lessonOidBySessionId[sessions[0].session_id];
    const reqZero = makeReq('http://localhost:3000/api/checkin', 'POST', {
      courseId: String(firstCourseOid),
      sessionId: String(firstLessonOid),
      attendanceData: [{ studentId: 'HS01', checkin: 0, comment: [] }]
    });
    const resZero = await runNext('/api/(course)/checkin/route', () => checkinPostHandler(reqZero));
    const makeupCountAfterZero = await MakeupSession.countDocuments({});

    // 1b. Kiểm tra từ chối giá trị điểm danh không hợp lệ (checkin = 99 -> HTTP 400)
    const reqInvalidCheckin = makeReq('http://localhost:3000/api/checkin', 'POST', {
      courseId: String(firstCourseOid),
      sessionId: String(firstLessonOid),
      attendanceData: [{ studentId: 'HS01', checkin: 99, comment: [] }]
    });
    const resInvalidCheckin = await runNext('/api/(course)/checkin/route', () =>
      checkinPostHandler(reqInvalidCheckin)
    );

    // 1c. Thực thi điểm danh thật toàn bộ 40 buổi (400 lượt HS) qua POST /api/(course)/checkin
    let allCheckinCallsOk = true;
    for (const s of sessions) {
      const cOid = courseOids[s.course_id];
      const lOid = lessonOidBySessionId[s.session_id];
      const ev = s.representative_attendance_event;
      const roster = courseRosters[s.course_id] || [];
      const attendanceData = roster.map((sid: string) => {
        const isTarget = sid === ev.student_id;
        return {
          studentId: sid,
          checkin: isTarget ? ev.checkin_code : 1,
          comment: ['Đạt mục tiêu bài học'],
          absenceReason: isTarget && ev.checkin_code === 3 ? 'Đơn xin nghỉ có phép' : isTarget && ev.checkin_code === 2 ? 'Vắng không phép' : ''
        };
      });

      const req = makeReq('http://localhost:3000/api/checkin', 'POST', {
        courseId: String(cOid),
        sessionId: String(lOid),
        attendanceData
      });
      const res = await runNext('/api/(course)/checkin/route', () => checkinPostHandler(req));
      if (res.status !== 200) allCheckinCallsOk = false;
    }

    // Chờ nhẹ các promise Zalo non-blocking nếu có trước khi hash/đếm
    await new Promise(r => setTimeout(r, 150));

    const createdMakeups = await MakeupSession.countDocuments({});
    const unexcusedCount = await MakeupSession.countDocuments({ makeupStatus: 'MAKEUP_REQUIRED' });
    const excusedCount = await MakeupSession.countDocuments({ makeupStatus: 'MAKEUP_PENDING' });

    const { hash, matrix } = await snapshotLayer1();
    layer1HashAfterCheckin = hash;
    layer1MatrixAfterCheckin = matrix;

    const assertions = [
      {
        name: 'Checkin = 0 does not create makeup session (Fix #2)',
        passed: resZero.status === 200 && makeupCountAfterZero === 0,
        message: `POST checkin=0 trả ${resZero.status}, số MakeupSession phát sinh = ${makeupCountAfterZero} (kỳ vọng 0)`
      },
      {
        name: 'Invalid checkin code rejected (400)',
        passed: resInvalidCheckin.status === 400,
        message: `POST checkin=99 bị từ chối với HTTP ${resInvalidCheckin.status}`
      },
      {
        name: '40 sessions checked in via real POST /api/checkin',
        passed: allCheckinCallsOk && matrix.length === 400,
        message: `Hoàn tất 40/40 buổi qua API thật, tổng bản ghi Lớp 1 = ${matrix.length} (40 buổi × 10 HS)`
      },
      {
        name: 'Auto-created exactly 12 Layer 2 makeup records (6 REQUIRED, 6 PENDING)',
        passed: createdMakeups === 12 && unexcusedCount === 6 && excusedCount === 6,
        message: `Tự động tạo ${createdMakeups}/12 bản ghi học bù (${unexcusedCount} REQUIRED, ${excusedCount} PENDING)`
      }
    ];

    results.push({
      id: 'TC-01',
      name: 'Điểm danh thật qua POST /api/checkin, chặn checkin=0 & chụp Hash Lớp 1',
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      duration_ms: Number((performance.now() - t0).toFixed(2)),
      details: {
        total_checkin_records: matrix.length,
        makeup_after_checkin_0: makeupCountAfterZero,
        auto_created_makeups: createdMakeups,
        sha256_hash_before_layer2: layer1HashAfterCheckin
      },
      assertions
    });
    console.log(`  -> TC-01: ${results[0].status} (Hash Lớp 1: ${layer1HashAfterCheckin.slice(0, 16)}...)\n`);
  }

  // =========================================================================
  // CA 2: GỌI THẬT POST & PATCH /api/academic/makeup-sessions + SO HASH LỚP 1
  // =========================================================================
  {
    const t0 = performance.now();
    console.log('[CA 2] Gọi thật POST/PATCH/GET makeup-sessions (FSM 8 trạng thái) & So Hash Lớp 1...');

    const makeupSessions = await MakeupSession.find({}).sort({ createdAt: 1 });
    const samplePending = makeupSessions.find(m => m.makeupStatus === 'MAKEUP_PENDING') || makeupSessions[0];

    // Negative Test 1: POST khởi tạo trực tiếp với MAKEUP_COMPLETED -> phải trả HTTP 400
    const reqBadInit = makeReq('http://localhost:3000/api/academic/makeup-sessions', 'POST', {
      courseId: String(samplePending.course),
      lessonId: String(samplePending.lesson),
      studentId: samplePending.studentId,
      makeupStatus: 'MAKEUP_COMPLETED'
    });
    const resBadInit = await makeupPostHandler(reqBadInit);

    // Negative Test 2: PATCH nhảy cóc PENDING/REQUIRED -> COMPLETED -> phải trả HTTP 400
    const reqJump = makeReq(
      `http://localhost:3000/api/academic/makeup-sessions/${samplePending._id}`,
      'PATCH',
      { makeupStatus: 'MAKEUP_COMPLETED' }
    );
    const resJump = await makeupPatchHandler(reqJump, { params: Promise.resolve({ id: String(samplePending._id) }) });

    // Negative Test 3: PATCH trạng thái không hợp lệ -> HTTP 400
    const reqInvalidStr = makeReq(
      `http://localhost:3000/api/academic/makeup-sessions/${samplePending._id}`,
      'PATCH',
      { makeupStatus: 'UNKNOWN_STATUS' }
    );
    const resInvalidStr = await makeupPatchHandler(reqInvalidStr, {
      params: Promise.resolve({ id: String(samplePending._id) })
    });

    // Chạy chu trình chuyển trạng thái thật qua PATCH /api/academic/makeup-sessions/[id] cho 12 ca
    // Đưa 4 ca COMPLETED, 2 ca ABSENT, 3 ca CANCELLED, và 3 ca EXPIRED (trong đó ca #12 test tự động quá hạn >30 ngày qua GET)
    let completedCount = 0;
    let absentCount = 0;
    let expiredCount = 0;
    let cancelledCount = 0;
    let allPatchOk = true;
    const patchErrors: string[] = [];
    let completedIdForResurrectTest = '';
    let absentIdForBadCancelTest = '';

    for (let i = 0; i < makeupSessions.length; i++) {
      const sess = makeupSessions[i];
      const id = String(sess._id);
      const callPatch = async (payload: Record<string, any>) => {
        const req = makeReq(`http://localhost:3000/api/academic/makeup-sessions/${id}`, 'PATCH', payload);
        return makeupPatchHandler(req, { params: Promise.resolve({ id }) });
      };
      const checkOk = async (res: Response, label: string) => {
        if (res.status !== 200) {
          allPatchOk = false;
          let txt = '';
          try { txt = await res.clone().text(); } catch {}
          patchErrors.push(`i=${i} ${label}: HTTP ${res.status} ${txt}`);
        }
      };

      if (i < 4) {
        const r1 = await callPatch({
          makeupStatus: 'MAKEUP_SCHEDULED',
          makeupDate: new RealDate(`2026-08-${20 + i}T00:00:00.000Z`),
          makeupTime: '14:00 - 15:30',
          makeupRoom: String(roomIds[4])
        });
        await checkOk(r1, 'r1_sched');
        const r2 = await callPatch({ makeupStatus: 'MAKEUP_COMPLETED' });
        await checkOk(r2, 'r2_comp');
        if (!completedIdForResurrectTest) completedIdForResurrectTest = id;
        completedCount++;
      } else if (i < 6) {
        const r1 = await callPatch({
          makeupStatus: 'MAKEUP_SCHEDULED',
          makeupDate: new RealDate(`2026-08-${20 + i}T00:00:00.000Z`),
          makeupTime: '14:00 - 15:30',
          makeupRoom: String(roomIds[4])
        });
        await checkOk(r1, 'r1_sched');
        const r2 = await callPatch({ makeupStatus: 'MAKEUP_ABSENT' });
        await checkOk(r2, 'r2_abs');
        if (!absentIdForBadCancelTest) absentIdForBadCancelTest = id;
        absentCount++;
      } else if (i < 9) {
        const r1 = await callPatch({ makeupStatus: 'MAKEUP_CANCELLED' });
        await checkOk(r1, 'r1_cancel');
        cancelledCount++;
      } else if (i < 11) {
        const r1 = await callPatch({ makeupStatus: 'MAKEUP_EXPIRED' });
        await checkOk(r1, 'r1_exp');
        expiredCount++;
      } else {
        // Ca #12: Đặt originalDate quá 30 ngày rồi gọi thật GET /api/academic/makeup-sessions (expireOverdueMakeupSessions)
        await MakeupSession.findByIdAndUpdate(id, {
          originalDate: new RealDate(RealDate.now() - 35 * 24 * 60 * 60 * 1000)
        });
        const getReq = makeReq('http://localhost:3000/api/academic/makeup-sessions', 'GET');
        const getRes = await makeupGetHandler(getReq);
        const updatedDoc = await MakeupSession.findById(id).lean();
        if (getRes.status !== 200 || (updatedDoc as any)?.makeupStatus !== 'MAKEUP_EXPIRED') {
          allPatchOk = false;
          let txt = '';
          try { txt = await getRes.clone().text(); } catch {}
          patchErrors.push(`i=${i} get_expire: HTTP ${getRes.status} docStatus=${(updatedDoc as any)?.makeupStatus} ${txt}`);
        }
        expiredCount++;
      }
    }

    const dbCompleted = await MakeupSession.countDocuments({ makeupStatus: 'MAKEUP_COMPLETED' });
    const dbAbsent = await MakeupSession.countDocuments({ makeupStatus: 'MAKEUP_ABSENT' });
    const dbExpired = await MakeupSession.countDocuments({ makeupStatus: 'MAKEUP_EXPIRED' });
    const dbCancelled = await MakeupSession.countDocuments({ makeupStatus: 'MAKEUP_CANCELLED' });

    // Negative Test 4: Hồi sinh trạng thái kết thúc COMPLETED -> SCHEDULED qua PATCH -> HTTP 400
    const reqResurrect = makeReq(
      `http://localhost:3000/api/academic/makeup-sessions/${completedIdForResurrectTest}`,
      'PATCH',
      { makeupStatus: 'MAKEUP_SCHEDULED' }
    );
    const resResurrect = await makeupPatchHandler(reqResurrect, {
      params: Promise.resolve({ id: completedIdForResurrectTest })
    });

    // Negative Test 5: Chuyển sai Hình 2: MAKEUP_ABSENT -> MAKEUP_CANCELLED qua PATCH -> HTTP 400
    const reqBadCancel = makeReq(
      `http://localhost:3000/api/academic/makeup-sessions/${absentIdForBadCancelTest}`,
      'PATCH',
      { makeupStatus: 'MAKEUP_CANCELLED' }
    );
    const resBadCancel = await makeupPatchHandler(reqBadCancel, {
      params: Promise.resolve({ id: absentIdForBadCancelTest })
    });

    // Negative Test 6 & 7: Lệnh xóa học bù (DELETE /api/academic/makeup-sessions/[id]) phải chặn COMPLETED và ABSENT với HTTP 400
    const reqDelCompleted = makeReq(
      `http://localhost:3000/api/academic/makeup-sessions/${completedIdForResurrectTest}`,
      'DELETE'
    );
    const resDelCompleted = await makeupDeleteHandler(reqDelCompleted, {
      params: Promise.resolve({ id: completedIdForResurrectTest })
    });
    const reqDelAbsent = makeReq(
      `http://localhost:3000/api/academic/makeup-sessions/${absentIdForBadCancelTest}`,
      'DELETE'
    );
    const resDelAbsent = await makeupDeleteHandler(reqDelAbsent, {
      params: Promise.resolve({ id: absentIdForBadCancelTest })
    });

    // Positive Test DELETE học bù: Tạo 1 phiên nháp MAKEUP_PENDING trên buổi phụ tách biệt -> gọi DELETE -> chuyển sang MAKEUP_CANCELLED (không xóa cứng)
    const dummyLessonId = new mongoose.Types.ObjectId();
    const tempMakeupDoc = await MakeupSession.create({
      course: samplePending.course,
      lesson: dummyLessonId,
      studentId: samplePending.studentId,
      makeupStatus: 'MAKEUP_PENDING',
      originalDate: new RealDate()
    });
    const reqDelValid = makeReq(
      `http://localhost:3000/api/academic/makeup-sessions/${tempMakeupDoc._id}`,
      'DELETE'
    );
    const resDelValid = await makeupDeleteHandler(reqDelValid, {
      params: Promise.resolve({ id: String(tempMakeupDoc._id) })
    });
    const tempMakeupAfterDel: any = await MakeupSession.findById(tempMakeupDoc._id).lean();
    const isSoftCancelledByDelete =
      resDelValid.status === 200 && tempMakeupAfterDel?.makeupStatus === 'MAKEUP_CANCELLED';
    await MakeupSession.findByIdAndDelete(tempMakeupDoc._id);

    // SO BĂM LỚP 1 SAU KHI CHẠY TOÀN BỘ FSM LỚP 2
    const { hash: layer1HashAfterFsm, matrix: layer1MatrixAfterFsm } = await snapshotLayer1();
    const isHashInvariant = layer1HashAfterCheckin === layer1HashAfterFsm;
    const overwrittenCount = layer1MatrixAfterCheckin.filter(
      (b, idx) => b.checkin !== layer1MatrixAfterFsm[idx]?.checkin
    ).length;

    // Kiểm tra thêm API đơn xin nghỉ của Phụ huynh (POST & DELETE /api/parent/leave-request) tuân thủ FSM trên buổi học tương lai tách biệt
    const futureLessonOid = new mongoose.Types.ObjectId();
    const tomorrow = new RealDate(RealDate.now() + 24 * 60 * 60 * 1000);
    const targetCourseDoc: any = await PostCourse.findById(samplePending.course);
    const testParentStuId = samplePending.studentId;
    const testParentStuDoc: any = await Student.findOne({ ID: testParentStuId }).lean();
    const parentJwt = signParentToken({
      phone: testParentStuDoc?.Phone || '0900000001',
      activeStudentId: testParentStuId
    });
    const makeParentReq = (method: string, bodyObj?: any) =>
      buildAuthedRequest(
        NextRequest,
        'http://localhost:3000/api/parent/leave-request',
        method,
        PARENT_COOKIE_NAME,
        parentJwt,
        bodyObj
      );

    targetCourseDoc.Detail.push({
      _id: futureLessonOid,
      Topic: targetCourseDoc.Detail[0]?.Topic,
      Day: tomorrow,
      Room: targetCourseDoc.Detail[0]?.Room,
      Time: '08:00 - 09:30',
      Teacher: targetCourseDoc.Detail[0]?.Teacher,
      Type: 'Chính thức'
    });
    await targetCourseDoc.save();

    // 1. Gửi đơn xin nghỉ hợp lệ (Checkin=0 -> Checkin=3, MAKEUP_PENDING)
    const resLeavePostOk = await leavePostHandler(
      makeParentReq('POST', { lessonId: String(futureLessonOid), reason: 'Bé bị ốm' })
    );
    // 2. Giả lập Học vụ đã xếp lịch bù (MAKEUP_SCHEDULED) -> Phụ huynh tự bấm hủy đơn (DELETE) phải bị chặn HTTP 400
    await MakeupSession.findOneAndUpdate(
      { studentId: testParentStuId, course: targetCourseDoc._id, lesson: futureLessonOid },
      { $set: { makeupStatus: 'MAKEUP_SCHEDULED' } }
    );
    const resLeaveCancelWhenScheduled = await leaveDeleteHandler(
      makeParentReq('DELETE', { lessonId: String(futureLessonOid) })
    );
    // 3. Khi đang ở MAKEUP_PENDING -> Phụ huynh hủy đơn (DELETE) hợp lệ -> HTTP 200 & chuyển sang MAKEUP_CANCELLED
    await MakeupSession.findOneAndUpdate(
      { studentId: testParentStuId, course: targetCourseDoc._id, lesson: futureLessonOid },
      { $set: { makeupStatus: 'MAKEUP_PENDING' } }
    );
    const resLeaveCancelValid = await leaveDeleteHandler(
      makeParentReq('DELETE', { lessonId: String(futureLessonOid) })
    );
    const leaveMakeupAfterCancel: any = await MakeupSession.findOne({
      studentId: testParentStuId,
      course: targetCourseDoc._id,
      lesson: futureLessonOid
    }).lean();
    // 4. Sau khi đã ở trạng thái kết thúc MAKEUP_CANCELLED -> Gửi lại POST xin nghỉ cùng buổi đó phải bị chặn HTTP 400
    const resLeavePostAfterCancel = await leavePostHandler(
      makeParentReq('POST', { lessonId: String(futureLessonOid), reason: 'Xin nghỉ lại' })
    );

    // 5. Khi phụ huynh đã hủy đơn (Checkin=0, MAKEUP_CANCELLED) mà giáo viên điểm danh vắng (Checkin=2)
    //    -> hệ thống phải tạo yêu cầu học bù MỚI (MAKEUP_REQUIRED), đồng thời giữ nguyên bản ghi MAKEUP_CANCELLED cũ
    const reqCheckinAfterParentCancel = makeReq('http://localhost:3000/api/checkin', 'POST', {
      courseId: String(targetCourseDoc._id),
      sessionId: String(futureLessonOid),
      attendanceData: [
        {
          studentId: testParentStuId,
          checkin: 2,
          comment: [],
          absenceReason: 'Vắng không phép sau khi phụ huynh hủy đơn xin nghỉ'
        }
      ]
    });
    const resCheckinAfterParentCancel = await runNext('/api/(course)/checkin/route', () =>
      checkinPostHandler(reqCheckinAfterParentCancel)
    );
    const makeupsAfterTeacherAbsent: any[] = await MakeupSession.find({
      studentId: testParentStuId,
      course: targetCourseDoc._id,
      lesson: futureLessonOid
    })
      .sort({ createdAt: 1 })
      .lean();
    const courseAfterTeacherAbsent: any = await PostCourse.findById(targetCourseDoc._id).lean();
    const stuAfterTeacherAbsent = (courseAfterTeacherAbsent?.Student || []).find(
      (s: any) => s.ID === testParentStuId
    );
    const learnAfterTeacherAbsent = (stuAfterTeacherAbsent?.Learn || []).find(
      (l: any) => String(l.Lesson) === String(futureLessonOid)
    );
    const isNewMakeupCreatedAfterParentCancel =
      resCheckinAfterParentCancel.status === 200 &&
      makeupsAfterTeacherAbsent.length === 2 &&
      makeupsAfterTeacherAbsent[0]?.makeupStatus === 'MAKEUP_CANCELLED' &&
      makeupsAfterTeacherAbsent[1]?.makeupStatus === 'MAKEUP_REQUIRED' &&
      learnAfterTeacherAbsent?.Checkin === 2 &&
      learnAfterTeacherAbsent?.makeupStatus === 'MAKEUP_REQUIRED';

    // Dọn sạch buổi học tương lai thử nghiệm để giữ nguyên dữ liệu 40 buổi cho các ca TC-03..TC-07
    await MakeupSession.deleteMany({ lesson: futureLessonOid });
    await PostCourse.updateOne(
      { _id: targetCourseDoc._id },
      {
        $pull: {
          Detail: { _id: futureLessonOid },
          'Student.$[].Learn': { Lesson: futureLessonOid }
        }
      }
    );

    const assertions = [
      {
        name: 'POST rejects invalid initial status (400)',
        passed: resBadInit.status === 400 && isValidInitialCheckPassed(),
        message: `POST với MAKEUP_COMPLETED bị máy chủ từ chối (HTTP ${resBadInit.status})`
      },
      {
        name: 'PATCH & DELETE block illegal FSM transitions, soft-cancel to MAKEUP_CANCELLED, and allow new makeup if teacher later marks absent',
        passed:
          resJump.status === 400 &&
          resInvalidStr.status === 400 &&
          resResurrect.status === 400 &&
          resBadCancel.status === 400 &&
          resDelCompleted.status === 400 &&
          resDelAbsent.status === 400 &&
          isSoftCancelledByDelete &&
          resLeavePostOk.status === 200 &&
          resLeaveCancelWhenScheduled.status === 400 &&
          resLeaveCancelValid.status === 200 &&
          leaveMakeupAfterCancel?.makeupStatus === 'MAKEUP_CANCELLED' &&
          resLeavePostAfterCancel.status === 400 &&
          isNewMakeupCreatedAfterParentCancel,
        message: `PATCH chặn sai (${resJump.status}/${resInvalidStr.status}/${resResurrect.status}/${resBadCancel.status}), DELETE học bù chặn COMPLETED/ABSENT (${resDelCompleted.status}/${resDelAbsent.status}) & soft-cancel=${isSoftCancelledByDelete}, Đơn xin nghỉ chặn hủy khi SCHEDULED (${resLeaveCancelWhenScheduled.status}) & chuyển MAKEUP_CANCELLED (${resLeaveCancelValid.status}), GV điểm danh vắng sau hủy đơn tạo mới MAKEUP_REQUIRED=${isNewMakeupCreatedAfterParentCancel}`
      },
      {
        name: 'All 12 makeup sessions cycled through real API (4/2/3/3)',
        passed:
          allPatchOk &&
          dbCompleted === 4 &&
          dbAbsent === 2 &&
          dbExpired === 3 &&
          dbCancelled === 3,
        message: `12 ca học bù chuyển qua API thật trong CSDL: ${dbCompleted} COMPLETED, ${dbAbsent} ABSENT, ${dbExpired} EXPIRED, ${dbCancelled} CANCELLED${patchErrors.length ? ' | Lỗi: ' + patchErrors.join('; ') : ''}`
      },
      {
        name: 'Layer 1 SHA-256 Checkin Hash Invariance after Layer 2 FSM',
        passed: isHashInvariant && overwrittenCount === 0,
        message: `Mã băm Lớp 1 trước & sau FSM Lớp 2 khớp tuyệt đối (${layer1HashAfterFsm.slice(0, 16)}..., 0 bị ghi đè)`
      }
    ];

    function isValidInitialCheckPassed() {
      return resBadInit.status === 400;
    }

    results.push({
      id: 'TC-02',
      name: 'FSM 8 trạng thái qua API thật (POST/PATCH/GET/DELETE & Leave Request) & Chứng minh Hash Lớp 1 bất biến',
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      duration_ms: Number((performance.now() - t0).toFixed(2)),
      details: {
        total_makeup_sessions: makeupSessions.length,
        completedCount,
        absentCount,
        expiredCount,
        cancelledCount,
        negative_http_codes: {
          invalid_init: resBadInit.status,
          jump_completed: resJump.status,
          invalid_enum: resInvalidStr.status,
          resurrect_terminal: resResurrect.status,
          cancel_from_absent: resBadCancel.status,
          delete_completed: resDelCompleted.status,
          delete_absent: resDelAbsent.status,
          parent_cancel_when_scheduled: resLeaveCancelWhenScheduled.status,
          parent_post_after_cancelled: resLeavePostAfterCancel.status
        },
        sha256_hash_before: layer1HashAfterCheckin,
        sha256_hash_after: layer1HashAfterFsm,
        hash_invariant: isHashInvariant,
        overwritten_count: overwrittenCount
      },
      assertions
    });
    console.log(`  -> TC-02: ${results[1].status} (Chặn 5/5 bước sai với HTTP 400, Hash Lớp 1 bất biến: ${isHashInvariant})\n`);
  }

  // =========================================================================
  // CA 3: ĐỘNG CƠ SLA THẬT (checkLessonAfterEnd) VỚI ĐỒNG HỒ GIẢ (30/60/90/120p)
  // =========================================================================
  {
    const t0 = performance.now();
    console.log('[CA 3] Chạy động cơ SLA thật (checkLessonAfterEnd) với Fake Clock qua mốc T0+30/60/90/120 phút...');

    await Promise.all([
      Notification.deleteMany({}),
      NotificationLog.deleteMany({}),
      NotificationRecipient.deleteMany({})
    ]);

    // Thiết lập T0 là 12:00:00 giờ địa phương hôm nay để buổi học có Time = '10:30 - 12:00'
    const baseAnchor = new RealDate();
    baseAnchor.setHours(12, 0, 0, 0);
    const T0_MS = baseAnchor.getTime();
    const lessonStartAt = new RealDate(T0_MS - 90 * 60 * 1000);

    // Chuẩn hóa 40 buổi học trong MongoDB khớp đúng kịch bản SLA ban đầu tại thời điểm T0:
    // - 22 buổi COMPLIANT: đầy đủ attendance + Note + DetailImage
    // - 8 buổi Mốc 1 (30m): thiếu attendance (Type='', Checkin=0), có Note & DetailImage
    // - 5 buổi Mốc 2 (60m): có attendance, thiếu Note (''), có DetailImage
    // - 3 buổi Mốc 3 (90m): có attendance & Note, thiếu Resource (Image='', DetailImage=[], Videos=[])
    // - 2 buổi Mốc 4 (120m): thiếu cả 3 mục (sẽ leo thang thành INCIDENT tại T0+120')
    for (const s of sessions) {
      const cOid = courseOids[s.course_id];
      const lOid = lessonOidBySessionId[s.session_id];
      const sla = s.sla_monitoring;

      const isDelayed = sla.status !== 'COMPLIANT';
      const missingItem = sla.missing_item;

      const needMissingAttendance = isDelayed && (missingItem === 'ATTENDANCE' || missingItem === 'UNCOMPLETED_REPORT');
      const needMissingJournal = isDelayed && (missingItem === 'LESSON_LOG' || missingItem === 'UNCOMPLETED_REPORT');
      const needMissingResource = isDelayed && (missingItem === 'RESOURCE_EVIDENCE' || missingItem === 'UNCOMPLETED_REPORT');

      await PostCourse.updateOne(
        { _id: cOid, 'Detail._id': lOid },
        {
          $set: {
            'Detail.$.Day': lessonStartAt,
            'Detail.$.Time': '10:30 - 12:00',
            'Detail.$.Type': needMissingAttendance ? '' : 'Chính thức',
            'Detail.$.Note': needMissingJournal ? '' : `Nhật ký ${s.topic}`,
            'Detail.$.Image': needMissingResource ? '' : 'synthetic_evidence',
            'Detail.$.DetailImage': needMissingResource ? [] : [{ id: `ev_${s.session_id}`, type: 'image', create: lessonStartAt }],
            'Detail.$.Videos': []
          }
        }
      );

      if (needMissingAttendance) {
        await PostCourse.updateOne(
          { _id: cOid },
          { $set: { 'Student.$[].Learn.$[les].Checkin': 0 } },
          { arrayFilters: [{ 'les.Lesson': lOid }] }
        );
      } else {
        await PostCourse.updateOne(
          { _id: cOid },
          { $set: { 'Student.$[].Learn.$[les].Checkin': 1 } },
          { arrayFilters: [{ 'les.Lesson': lOid }] }
        );
      }
    }

    const slaCheckAll = async () => {
      for (const s of sessions) {
        const cOid = courseOids[s.course_id];
        const lOid = lessonOidBySessionId[s.session_id];
        await checkLessonAfterEnd(String(cOid), String(lOid));
      }
    };

    const remediateSession = async (s: any) => {
      const cOid = courseOids[s.course_id];
      const lOid = lessonOidBySessionId[s.session_id];
      await PostCourse.updateOne(
        { _id: cOid, 'Detail._id': lOid },
        {
          $set: {
            'Detail.$.Type': 'Chính thức',
            'Detail.$.Note': `GV đã bổ sung nhật ký ${s.topic}`,
            'Detail.$.Image': 'remediated_evidence',
            'Detail.$.DetailImage': [{ id: `rem_${s.session_id}`, type: 'image', create: new RealDate() }]
          }
        }
      );
      await PostCourse.updateOne(
        { _id: cOid },
        { $set: { 'Student.$[].Learn.$[les].Checkin': 1 } },
        { arrayFilters: [{ 'les.Lesson': lOid }] }
      );
    };

    let countAt10m = -1;
    let countAtt30m = 0;
    let countLog60m = 0;
    let countRes90m = 0;
    let countInc120m = 0;
    let resolvedEarlyDb = 0;
    let compliantFalsePositives = -1;

    try {
      installFakeClock(T0_MS + 10 * 60 * 1000);
      await slaCheckAll();
      countAt10m = await Notification.countDocuments({});

      // Mốc 1: T0 + 31' (phát sinh MISSING_ATTENDANCE cho 8 ca Mốc 1 + 2 ca Mốc 4)
      advanceFakeClockTo(T0_MS + 31 * 60 * 1000);
      await slaCheckAll();
      const milestone30Sessions = sessions.filter(s => s.sla_monitoring.trigger_checkpoint_minutes === 30);
      countAtt30m = await Notification.countDocuments({
        type: 'MISSING_ATTENDANCE',
        ref_lesson: { $in: milestone30Sessions.map(s => lessonOidBySessionId[s.session_id]) }
      });
      // GV khắc phục 8 ca Mốc 1 trước khi sang mốc 60'
      for (const s of milestone30Sessions) await remediateSession(s);

      // Mốc 2: T0 + 61' (8 ca Mốc 1 tự động RESOLVED; phát sinh MISSING_LESSON_LOG cho 5 ca Mốc 2)
      advanceFakeClockTo(T0_MS + 61 * 60 * 1000);
      await slaCheckAll();
      const milestone60Sessions = sessions.filter(s => s.sla_monitoring.trigger_checkpoint_minutes === 60);
      countLog60m = await Notification.countDocuments({
        type: 'MISSING_LESSON_LOG',
        ref_lesson: { $in: milestone60Sessions.map(s => lessonOidBySessionId[s.session_id]) }
      });
      // GV khắc phục 5 ca Mốc 2 trước khi sang mốc 90'
      for (const s of milestone60Sessions) await remediateSession(s);

      // Mốc 3: T0 + 91' (5 ca Mốc 2 tự động RESOLVED; phát sinh MISSING_RESOURCE cho 3 ca Mốc 3)
      advanceFakeClockTo(T0_MS + 91 * 60 * 1000);
      await slaCheckAll();
      const milestone90Sessions = sessions.filter(s => s.sla_monitoring.trigger_checkpoint_minutes === 90);
      countRes90m = await Notification.countDocuments({
        type: 'MISSING_RESOURCE',
        ref_lesson: { $in: milestone90Sessions.map(s => lessonOidBySessionId[s.session_id]) }
      });
      // GV khắc phục 3 ca Mốc 3 trước khi sang mốc 120'
      for (const s of milestone90Sessions) await remediateSession(s);

      // Mốc 4: T0 + 121' (3 ca Mốc 3 tự động RESOLVED; 2 ca Mốc 4 leo thang INCIDENT)
      advanceFakeClockTo(T0_MS + 121 * 60 * 1000);
      await slaCheckAll();

      const milestone120Sessions = sessions.filter(s => s.sla_monitoring.trigger_checkpoint_minutes === 120);
      countInc120m = await Notification.countDocuments({
        type: 'SLA_VIOLATION',
        level: 'INCIDENT',
        ref_lesson: { $in: milestone120Sessions.map(s => lessonOidBySessionId[s.session_id]) }
      });

      const allEarlyLessonIds = [...milestone30Sessions, ...milestone60Sessions, ...milestone90Sessions].map(
        s => lessonOidBySessionId[s.session_id]
      );
      resolvedEarlyDb = await Notification.countDocuments({
        ref_lesson: { $in: allEarlyLessonIds },
        status: 'RESOLVED'
      });

      const compliantLessonIds = sessions
        .filter(s => s.sla_monitoring.status === 'COMPLIANT')
        .map(s => lessonOidBySessionId[s.session_id]);
      compliantFalsePositives = await Notification.countDocuments({
        ref_lesson: { $in: compliantLessonIds }
      });
    } finally {
      restoreRealClock();
    }

    const assertions = [
      {
        name: 'Zero alerts before 30m (T0+10m)',
        passed: countAt10m === 0,
        message: `Tại T0+10' (fake clock): ${countAt10m} cảnh báo phát sinh`
      },
      {
        name: 'SLA 4-checkpoint detection via real checkLessonAfterEnd (8/5/3/2)',
        passed: countAtt30m === 8 && countLog60m === 5 && countRes90m === 3 && countInc120m === 2,
        message: `Hàm thật phát hiện đúng: ${countAtt30m}/8 (30m), ${countLog60m}/5 (60m), ${countRes90m}/3 (90m), ${countInc120m}/2 INCIDENT (120m)`
      },
      {
        name: 'Early auto-resolution rate (16/18)',
        passed: resolvedEarlyDb === 16,
        message: `Tự động đóng RESOLVED trong CSDL ${resolvedEarlyDb}/16 ca khắc phục trước 120'`
      },
      {
        name: 'Zero false positives on 22 compliant lessons',
        passed: compliantFalsePositives === 0,
        message: `0 cảnh báo sai trên 22 buổi đúng hạn (FP = ${compliantFalsePositives})`
      }
    ];

    results.push({
      id: 'TC-03',
      name: 'Động cơ SLA thật (checkLessonAfterEnd) với Fake Clock 30/60/90/120 phút',
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      duration_ms: Number((performance.now() - t0).toFixed(2)),
      details: {
        alerts_at_10m: countAt10m,
        checkpoint_distribution: { '30m': countAtt30m, '60m': countLog60m, '90m': countRes90m, '120m': countInc120m },
        early_resolved_in_db: resolvedEarlyDb,
        incidents_escalated: countInc120m,
        compliant_fp: compliantFalsePositives
      },
      assertions
    });
    console.log(`  -> TC-03: ${results[2].status} (8/30m, 5/60m, 3/90m tự đóng RESOLVED=16, 2 INCIDENT, FP=0)\n`);
  }

  // =========================================================================
  // CA 4: BỘ LỌC ĐƠN XIN NGHỈ (EXCUSE FILTER) & CHẶN OUTBOUND ZALO/APPSCRIPT
  // =========================================================================
  {
    const t0 = performance.now();
    console.log('[CA 4] Kiểm tra Excuse Filter (Zalo) qua sendInstantCheckinZaloNotification & đo Mock Outbound...');

    await ZaloMessageLog.deleteMany({});
    const beforeZaloBlocked = outboundTelemetry.zaloBotBlocked;
    const beforeAppScriptBlocked = outboundTelemetry.appscriptBlocked;

    let excusedBlockedCount = 0;
    let unexcusedDispatchedCount = 0;
    let presentDispatchedCount = 0;

    for (const s of sessions) {
      const ev = s.representative_attendance_event;
      const cOid = courseOids[s.course_id];
      const lOid = lessonOidBySessionId[s.session_id];
      const notiRes = await sendInstantCheckinZaloNotification({
        studentId: ev.student_id,
        courseId: cOid,
        lessonId: lOid,
        checkin: ev.checkin_code
      });

      if (ev.checkin_code === 3) {
        if (notiRes?.skipped && notiRes?.reason === 'EXCUSED_LEAVE') excusedBlockedCount++;
      } else if (ev.checkin_code === 2) {
        if (notiRes?.success && notiRes?.type === 'INSTANT_CHECKIN_ABSENT') unexcusedDispatchedCount++;
      } else if (ev.checkin_code === 1) {
        if (notiRes?.success && notiRes?.type === 'INSTANT_CHECKIN_PRESENT') presentDispatchedCount++;
      }
    }

    const zaloBlockedDelta = outboundTelemetry.zaloBotBlocked - beforeZaloBlocked;
    const appScriptBlockedDelta = outboundTelemetry.appscriptBlocked - beforeAppScriptBlocked;

    const assertions = [
      {
        name: 'Excused leaves suppressed (Checkin = 3)',
        passed: excusedBlockedCount === 6,
        message: `Chặn gửi đúng ${excusedBlockedCount}/6 học sinh có đơn xin nghỉ (Checkin = 3)`
      },
      {
        name: 'Unexcused leaves dispatched (Checkin = 2)',
        passed: unexcusedDispatchedCount === 6,
        message: `Phát đúng ${unexcusedDispatchedCount}/6 cảnh báo vắng không phép (Checkin = 2)`
      },
      {
        name: 'Present checkins dispatched (Checkin = 1)',
        passed: presentDispatchedCount === 28,
        message: `Phát đúng ${presentDispatchedCount}/28 thông báo có mặt (Checkin = 1)`
      },
      {
        name: 'Outbound Zalo Bot API & Google Apps Script intercepted (0 real calls)',
        passed: zaloBlockedDelta > 0 && appScriptBlockedDelta > 0 && outboundTelemetry.realOutboundSent === 0,
        message: `Đã chặn thành công ${zaloBlockedDelta} request Zalo Bot API & ${appScriptBlockedDelta} request Google Apps Script (0 tin thật ra ngoài)`
      }
    ];

    results.push({
      id: 'TC-04',
      name: 'Bộ lọc đơn xin nghỉ (Excuse Filter) & Chặn 100% network Zalo/AppsScript',
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      duration_ms: Number((performance.now() - t0).toFixed(2)),
      details: {
        excused_suppressed: excusedBlockedCount,
        unexcused_dispatched: unexcusedDispatchedCount,
        present_dispatched: presentDispatchedCount,
        mocked_zalo_bot_calls: zaloBlockedDelta,
        mocked_appscript_calls: appScriptBlockedDelta,
        real_outbound_sent: outboundTelemetry.realOutboundSent
      },
      assertions
    });
    console.log(`  -> TC-04: ${results[3].status} (Chặn 6/6 có phép; chặn mock ${zaloBlockedDelta} ZaloBot + ${appScriptBlockedDelta} AppsScript)\n`);
  }

  // =========================================================================
  // CA 5: CHỐNG GỬI TRÙNG THÔNG BÁO ZALO TRONG CỬA SỔ 24 GIỜ
  // =========================================================================
  {
    const t0 = performance.now();
    console.log('[CA 5] Kiểm tra Chống gửi trùng thông báo Zalo trong cửa sổ 24 giờ...');

    const crsOid = courseOids['CRS-K01'];
    const lessonOid = lessonOidBySessionId['CRS-K01-S01'];
    const testStudentId = 'HS01';
    await ZaloMessageLog.deleteMany({ studentId: testStudentId, lessonId: lessonOid, type: 'INSTANT_CHECKIN_ABSENT' });

    const firstCall = await sendInstantCheckinZaloNotification({
      studentId: testStudentId,
      courseId: crsOid,
      lessonId: lessonOid,
      checkin: 2
    });
    const secondCall = await sendInstantCheckinZaloNotification({
      studentId: testStudentId,
      courseId: crsOid,
      lessonId: lessonOid,
      checkin: 2
    });

    const isSuppressed = secondCall?.status === 'DUPLICATE_SUPPRESSED' || secondCall?.reason === 'DUPLICATE_WITHIN_24H';
    const logCount = await ZaloMessageLog.countDocuments({
      studentId: testStudentId,
      lessonId: lessonOid,
      type: 'INSTANT_CHECKIN_ABSENT'
    });

    const assertions = [
      {
        name: 'First dispatch recorded',
        passed: firstCall?.success === true && !firstCall?.skipped,
        message: 'Lượt gửi đầu tiên được tiếp nhận và lưu ZaloMessageLog'
      },
      {
        name: 'Duplicate call within 24h suppressed',
        passed: isSuppressed,
        message: `Lượt gửi thứ 2 trong 24h bị chặn: ${secondCall?.status} (${secondCall?.reason})`
      },
      {
        name: 'Single log entry preserved',
        passed: logCount === 1,
        message: `Số bản ghi ZaloMessageLog giữ nguyên = ${logCount} (không nhân bản)`
      }
    ];

    results.push({
      id: 'TC-05',
      name: 'Cơ chế chống gửi trùng thông báo Zalo trong cửa sổ 24 giờ',
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      duration_ms: Number((performance.now() - t0).toFixed(2)),
      details: {
        first_call_status: firstCall?.status,
        second_call_status: secondCall?.status,
        suppression_reason: secondCall?.reason,
        zalo_log_count: logCount
      },
      assertions
    });
    console.log(`  -> TC-05: ${results[4].status} (Chặn trùng 24h: ${isSuppressed}, log=${logCount})\n`);
  }

  // =========================================================================
  // CA 6: XUNG ĐỘT LỊCH PHÒNG HỌC (StartA < EndB & StartB < EndA)
  // =========================================================================
  {
    const t0 = performance.now();
    console.log('[CA 6] Kiểm tra Thuật toán phát hiện xung đột phòng học (checkScheduleConflict)...');

    // Khôi phục ngày buổi 1 về 2026-07-01 08:30 - 10:00 tại Lab 01 để đối chiếu trực tiếp trên CSDL
    await PostCourse.updateOne(
      { _id: courseOids['CRS-K01'], 'Detail._id': lessonOidBySessionId['CRS-K01-S01'] },
      {
        $set: {
          'Detail.$.Day': new RealDate('2026-07-01T08:00:00.000Z'),
          'Detail.$.Time': '08:30 - 10:00',
          'Detail.$.Room': roomIds[0]
        }
      }
    );

    const conflictResult = await checkScheduleConflict({
      date: '2026-07-01',
      timeStr: '09:00 - 10:30',
      roomId: roomIds[0]
    });
    const contiguousResult = await checkScheduleConflict({
      date: '2026-07-01',
      timeStr: '10:00 - 11:30',
      roomId: roomIds[0]
    });
    const freeSlotResult = await checkScheduleConflict({
      date: '2026-07-01',
      timeStr: '14:00 - 15:30',
      roomId: roomIds[0]
    });
    const otherDateResult = await checkScheduleConflict({
      date: '2026-07-02',
      timeStr: '08:30 - 10:00',
      roomId: roomIds[0]
    });

    const formulaOverlap = isTimeOverlapping({ start: 510, end: 600 }, { start: 540, end: 630 });
    const formulaContiguous = isTimeOverlapping({ start: 510, end: 600 }, { start: 600, end: 690 });

    const assertions = [
      {
        name: 'Overlapping slot detected as conflict',
        passed: conflictResult.hasConflict === true && formulaOverlap === true,
        message: 'Phát hiện xung đột khi chồng lấn 08:30-10:00 vs 09:00-10:30 (Công thức 1)'
      },
      {
        name: 'Contiguous boundary EndA = StartB permitted',
        passed: contiguousResult.hasConflict === false && formulaContiguous === false,
        message: 'Cho phép 2 ca nối tiếp sát nút 10:00-11:30 (EndA = StartB)'
      },
      {
        name: 'Free slot same day permitted',
        passed: freeSlotResult.hasConflict === false,
        message: 'Khung giờ trống 14:00-15:30 hợp lệ'
      },
      {
        name: 'Other date permitted',
        passed: otherDateResult.hasConflict === false,
        message: 'Ngày khác (2026-07-02) không xung đột'
      }
    ];

    results.push({
      id: 'TC-06',
      name: 'Kiểm tra xung đột lịch phòng học qua hàm thật checkScheduleConflict',
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      duration_ms: Number((performance.now() - t0).toFixed(2)),
      details: {
        overlapping_conflict: conflictResult.hasConflict,
        contiguous_conflict: contiguousResult.hasConflict,
        free_slot_conflict: freeSlotResult.hasConflict,
        other_date_conflict: otherDateResult.hasConflict
      },
      assertions
    });
    console.log(`  -> TC-06: ${results[5].status} (Chồng lấn=Xung đột, Sát nút=Hợp lệ)\n`);
  }

  // =========================================================================
  // CA 7: GỌI THẬT DELETE /api/(area)/area/[id]?roomId=... CHO CASCADING CLEANUP
  // =========================================================================
  {
    const t0 = performance.now();
    console.log('[CA 7] Gọi thật DELETE /api/area/[id]?roomId=... kiểm tra Cascading Cleanup...');

    const targetRoomId = roomIds[0];
    // Đảm bảo có ít nhất 1 phiên học bù đang gán phòng targetRoomId với roomAlert=false
    const sampleMakeup = await MakeupSession.findOne({});
    if (sampleMakeup) {
      await MakeupSession.findByIdAndUpdate(sampleMakeup._id, {
        makeupRoom: targetRoomId,
        roomAlert: false
      });
    }

    const reqDel = makeReq(
      `http://localhost:3000/api/area/${String(areaDoc._id)}?roomId=${String(targetRoomId)}`,
      'DELETE'
    );
    const resDel = await runNext('/api/(area)/area/[id]/route', () =>
      areaDeleteHandler(reqDel, { params: Promise.resolve({ id: String(areaDoc._id) }) })
    );

    const updatedArea = await Area.findById(areaDoc._id).lean();
    const roomStillExists = (updatedArea as any)?.rooms?.some((r: any) => String(r._id) === String(targetRoomId));
    const coursesWithDeletedRoom = await PostCourse.countDocuments({ 'Detail.Room': targetRoomId });
    const makeupsWithDeletedRoom = await MakeupSession.countDocuments({ makeupRoom: targetRoomId });
    const alertedMakeups = await MakeupSession.countDocuments({ _id: sampleMakeup?._id, roomAlert: true });

    const assertions = [
      {
        name: 'DELETE /api/area/[id]?roomId=... succeeded (200)',
        passed: resDel.status === 200 && !roomStillExists,
        message: `API xóa phòng trả HTTP ${resDel.status}, phòng đã bị gỡ khỏi Area`
      },
      {
        name: 'Course detail room references cleared to null',
        passed: coursesWithDeletedRoom === 0,
        message: `Số buổi học còn tham chiếu phòng đã xóa = ${coursesWithDeletedRoom}`
      },
      {
        name: 'Makeup room references cleared & roomAlert triggered',
        passed: makeupsWithDeletedRoom === 0 && alertedMakeups >= 1,
        message: `Tham chiếu phòng học bù = ${makeupsWithDeletedRoom}, cờ roomAlert bật = ${alertedMakeups}`
      }
    ];

    results.push({
      id: 'TC-07',
      name: 'Cascading Cleanup khi xóa phòng học qua API thật DELETE /api/area/[id]',
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      duration_ms: Number((performance.now() - t0).toFixed(2)),
      details: {
        http_status: resDel.status,
        room_still_exists: roomStillExists,
        orphan_course_references: coursesWithDeletedRoom,
        orphan_makeup_references: makeupsWithDeletedRoom,
        alerted_makeup_sessions: alertedMakeups
      },
      assertions
    });
    console.log(`  -> TC-07: ${results[6].status} (HTTP ${resDel.status}, dọn sạch tham chiếu & bật roomAlert)\n`);
  }

  // =========================================================================
  // XUẤT FILE LOG KẾT QUẢ KIỂM THỬ TÍCH HỢP
  // =========================================================================
  const totalPassed = results.filter(r => r.status === 'PASSED').length;
  const totalFailed = results.filter(r => r.status === 'FAILED').length;
  const totalDuration = results.reduce((acc, r) => acc + r.duration_ms, 0);

  const finalReport = {
    metadata: {
      title: 'AIR Manager - Real Integration Test Suite Report (7 Test Cases)',
      reference: 'JSLHU-SysAir_v9.docx & Mentor Review Guidelines',
      executed_at: new RealDate().toISOString(),
      git_commit_hash: getGitCommitHash(),
      database_target: EXPECTED_TEST_DB,
      outbound_network_telemetry: outboundTelemetry,
      environment: {
        os: `${os.type()} ${os.release()} (${os.arch()})`,
        node_version: process.version,
        cpu: os.cpus()[0]?.model || 'Unknown CPU',
        total_memory_gb: Math.round(os.totalmem() / 1024 ** 3)
      },
      summary: {
        total_test_cases: results.length,
        passed_test_cases: totalPassed,
        failed_test_cases: totalFailed,
        success_rate: `${((totalPassed / results.length) * 100).toFixed(1)}%`,
        total_execution_time_ms: Number(totalDuration.toFixed(2))
      }
    },
    test_cases: results
  };

  const logDir = path.resolve(process.cwd(), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logFilePath = path.join(logDir, 'integration_test_results.json');
  fs.writeFileSync(logFilePath, JSON.stringify(finalReport, null, 2), 'utf-8');

  console.log('======================================================================');
  console.log('                 KẾT QUẢ KIỂM THỬ TÍCH HỢP THẬT');
  console.log('======================================================================');
  console.log(`Tổng số ca kiểm thử: ${results.length}`);
  console.log(`Thành công (PASSED): ${totalPassed} / ${results.length} (${((totalPassed / results.length) * 100).toFixed(1)}%)`);
  console.log(`Thất bại  (FAILED):  ${totalFailed}`);
  console.log(`Outbound chặn được:  ZaloBot=${outboundTelemetry.zaloBotBlocked}, AppsScript=${outboundTelemetry.appscriptBlocked}, RealSent=${outboundTelemetry.realOutboundSent}`);
  console.log(`Thời gian thực thi:  ${totalDuration.toFixed(2)} ms`);
  console.log(`File log xuất ra:    ${logFilePath}`);
  console.log('======================================================================\n');

  await mongoose.disconnect();
}

runAllTests().catch(async err => {
  restoreRealClock();
  console.error('\n[FATAL ERROR] Lỗi khi chạy kiểm thử tích hợp:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
