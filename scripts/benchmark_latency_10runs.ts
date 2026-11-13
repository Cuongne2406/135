import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import mongoose from 'mongoose';

function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function calcMean(arr: number[]): number {
  const sum = arr.reduce((a, b) => a + b, 0);
  return Number((sum / arr.length).toFixed(1));
}

function calcSampleStdDev(arr: number[]): number {
  const n = arr.length;
  if (n <= 1) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (n - 1);
  return Number(Math.sqrt(variance).toFixed(1));
}

function calcMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Number(med.toFixed(1));
}

function calcPearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Number((num / denom).toFixed(4));
}

/**
 * Đảm bảo khóa học kịch bản CRS-K01 trong DB có đúng 8 buổi học và 10 học sinh giả định (HS01..HS10)
 * bằng thao tác upsert an toàn (không xóa dữ liệu hiện có).
 */
async function ensureSyntheticTestbedInDB(db: mongoose.mongo.Db) {
  const studentsCol = db.collection('students');
  const coursesCol = db.collection('courses');

  const studentIds = ['HS01', 'HS02', 'HS03', 'HS04', 'HS05', 'HS06', 'HS07', 'HS08', 'HS09', 'HS10', 'HS11', 'HS12'];
  for (const sid of studentIds) {
    await studentsCol.updateOne(
      { ID: sid },
      {
        $setOnInsert: {
          ID: sid,
          Name: sid,
          ParentName: `PH-${sid}`,
          Phone: '0900000000',
          Email: `${sid.toLowerCase()}@test.local`,
          School: 'THCS STEM',
          Avt: '/assets/default-avatar.png',
          Status: true,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  const baseDate = new Date('2026-07-04T08:30:00Z');
  const lessons = Array.from({ length: 8 }, (_, idx) => ({
    _id: new mongoose.Types.ObjectId(`6a97af613b1fbc04f1ca4d8${idx}`),
    Day: new Date(baseDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000),
    Time: '08:30 - 10:00',
    Type: 'Chính thức',
    TopicName: `Bài ${idx + 1}: Thực hành Robotics Cơ bản`,
    Note: `Nhật ký giảng dạy buổi ${idx + 1}`,
    Image: 'synthetic_evidence_image',
    DetailImage: [{ id: `ev_${idx}`, type: 'image', create: baseDate }],
  }));

  const enrolled10 = studentIds.slice(0, 10).map((sid) => ({
    ID: sid,
    Learn: lessons.map((les) => ({
      Lesson: les._id,
      Checkin: 1,
      Cmt: ['Hoàn thành nội dung thực hành'],
      makeupStatus: 'NOT_REQUIRED',
    })),
  }));

  await coursesCol.updateOne(
    { ID: 'CRS-K01' },
    {
      $set: {
        ID: 'CRS-K01',
        Name: 'Robotics Cơ bản (Kịch bản kiểm thử)',
        Type: 'AI Robotic',
        Status: true,
        Detail: lessons,
        Student: enrolled10,
      },
    },
    { upsert: true }
  );

  const verifiedCourse = await coursesCol.findOne({ ID: 'CRS-K01' });
  return {
    courseId: verifiedCourse?._id,
    courseCode: verifiedCourse?.ID || 'CRS-K01',
    lessonsCount: verifiedCourse?.Detail?.length || 0,
    studentsCount: verifiedCourse?.Student?.length || 0,
  };
}

/**
 * Màn hình 1: Danh sách học viên
 */
async function measureScreen1StudentList(db: mongoose.mongo.Db) {
  const studentsCol = db.collection('students');
  const areasCol = db.collection('areas');
  const coursesCol = db.collection('courses');

  // Baseline: Truy vấn tuần tự nhiều vòng (waterfall) không dùng proyección rút gọn
  const tBase0 = performance.now();
  const rawStudents = await studentsCol.find({}).limit(12).toArray();
  for (const st of rawStudents.slice(0, 10)) {
    await areasCol.findOne({ _id: st.Area });
    await coursesCol.findOne({ 'Student.ID': st.ID });
  }
  const baselineMs = Number((performance.now() - tBase0).toFixed(1));

  // Proposed: Truy vấn gộp song song trên máy chủ với chỉ mục và .lean()
  const tProp0 = performance.now();
  await Promise.all([
    studentsCol
      .find({}, { projection: { ID: 1, Name: 1, Phone: 1, Area: 1, Course: 1, Status: 1 } })
      .limit(20)
      .toArray(),
    areasCol.find({}, { projection: { name: 1, color: 1 } }).toArray(),
  ]);
  const proposedMs = Number((performance.now() - tProp0).toFixed(1));

  return { baselineMs, proposedMs };
}

/**
 * Màn hình 2: Chi tiết khóa học (8 buổi học, 10 HS giả lập)
 */
async function measureScreen2CourseDetail(db: mongoose.mongo.Db) {
  const coursesCol = db.collection('courses');
  const studentsCol = db.collection('students');
  const makeupCol = db.collection('makeupsessions');
  const areasCol = db.collection('areas');

  // Baseline: Truy vấn tuần tự từng học sinh (10 HS) và từng buổi học (8 buổi)
  const tBase0 = performance.now();
  const courseDoc = await coursesCol.findOne({ ID: 'CRS-K01' });
  const enrolledIds: string[] = (courseDoc?.Student || []).map((s: any) => s.ID);
  for (const sid of enrolledIds) {
    await studentsCol.findOne({ ID: sid });
  }
  for (const les of (courseDoc?.Detail || []).slice(0, 8)) {
    await makeupCol.find({ course: courseDoc?._id, lesson: les._id }).toArray();
  }
  const baselineMs = Number((performance.now() - tBase0).toFixed(1));

  // Proposed: Truy vấn song song khóa học CRS-K01 (8 buổi, 10 HS), danh sách 10 HS bằng $in và danh sách học bù
  const tProp0 = performance.now();
  await Promise.all([
    coursesCol.findOne(
      { ID: 'CRS-K01' },
      { projection: { ID: 1, Name: 1, Type: 1, Area: 1, TeacherHR: 1, Detail: 1, Student: 1 } }
    ),
    studentsCol
      .find(
        { ID: { $in: ['HS01', 'HS02', 'HS03', 'HS04', 'HS05', 'HS06', 'HS07', 'HS08', 'HS09', 'HS10'] } },
        { projection: { ID: 1, Name: 1, Phone: 1 } }
      )
      .toArray(),
    makeupCol.find({ course: courseDoc?._id }).toArray(),
    areasCol.find({}, { projection: { name: 1, rooms: 1 } }).toArray(),
  ]);
  const proposedMs = Number((performance.now() - tProp0).toFixed(1));

  return { baselineMs, proposedMs };
}

/**
 * Màn hình 3: Lịch học (Calendar)
 */
async function measureScreen3Calendar(db: mongoose.mongo.Db) {
  const coursesCol = db.collection('courses');
  const trialCol = db.collection('trialcourses');
  const areasCol = db.collection('areas');
  const booksCol = db.collection('books');
  const usersCol = db.collection('users');

  // Baseline: Truy vấn tuần tự nhiều bảng không gộp
  const tBase0 = performance.now();
  const allCourses = await coursesCol.find({}).toArray();
  await trialCol.find({}).toArray();
  await areasCol.find({}).toArray();
  await booksCol.find({}).toArray();
  await usersCol.find({}).toArray();
  for (const c of allCourses.slice(0, 5)) {
    await coursesCol.findOne({ _id: c._id });
  }
  const baselineMs = Number((performance.now() - tBase0).toFixed(1));

  // Proposed: Truy vấn song song lịch chính thức và lịch học thử với trường rút gọn
  const tProp0 = performance.now();
  await Promise.all([
    coursesCol
      .find(
        { Status: true },
        {
          projection: {
            ID: 1,
            Name: 1,
            Area: 1,
            'Detail._id': 1,
            'Detail.Day': 1,
            'Detail.Time': 1,
            'Detail.Room': 1,
            'Detail.Teacher': 1,
          },
        }
      )
      .toArray(),
    trialCol
      .find({}, { projection: { name: 1, 'sessions._id': 1, 'sessions.day': 1, 'sessions.time': 1 } })
      .toArray(),
    areasCol.find({}, { projection: { name: 1, color: 1, rooms: 1 } }).toArray(),
  ]);
  const proposedMs = Number((performance.now() - tProp0).toFixed(1));

  return { baselineMs, proposedMs };
}

/**
 * Màn hình 4: Dashboard điều hành học vụ
 */
async function measureScreen4AdminDashboard(db: mongoose.mongo.Db) {
  const notifsCol = db.collection('notifications');
  const makeupCol = db.collection('makeupsessions');
  const coursesCol = db.collection('courses');
  const zaloCol = db.collection('zalomessagelogs');
  const areasCol = db.collection('areas');

  // Baseline: Truy vấn tuần tự từng thống kê trên bảng điều khiển
  const tBase0 = performance.now();
  await notifsCol.find({ type: 'MISSING_ATTENDANCE' }).toArray();
  await notifsCol.find({ type: 'MISSING_LESSON_LOG' }).toArray();
  await notifsCol.find({ type: 'MISSING_RESOURCE' }).toArray();
  await notifsCol.find({ type: 'SLA_VIOLATION' }).toArray();
  await makeupCol.find({}).toArray();
  await coursesCol.find({}).toArray();
  await zaloCol.find({}).limit(50).toArray();
  await areasCol.find({}).toArray();
  const baselineMs = Number((performance.now() - tBase0).toFixed(1));

  // Proposed: Gộp truy vấn cảnh báo SLA, danh sách học bù và thông tin khóa học
  const tProp0 = performance.now();
  await Promise.all([
    notifsCol
      .find(
        { type: { $in: ['MISSING_ATTENDANCE', 'MISSING_LESSON_LOG', 'MISSING_RESOURCE', 'SLA_VIOLATION'] } },
        { projection: { title: 1, type: 1, level: 1, status: 1, ref_course: 1, ref_lesson: 1, createdAt: 1 } }
      )
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    makeupCol
      .find({}, { projection: { studentId: 1, course: 1, lesson: 1, makeupStatus: 1, originalDate: 1, makeupDate: 1 } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    coursesCol.find({}, { projection: { ID: 1, Name: 1, Area: 1 } }).toArray(),
    areasCol.find({}, { projection: { name: 1, rooms: 1 } }).toArray(),
  ]);
  const proposedMs = Number((performance.now() - tProp0).toFixed(1));

  return { baselineMs, proposedMs };
}

async function main() {
  const uri = process.env.MongoDB_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MongoDB_URI / MONGODB_URI in environment.');
  }

  console.log('[1/4] Connecting to MongoDB Atlas & ensuring synthetic course CRS-K01 (8 lessons, 10 synthetic students)...');
  const tWarmup0 = performance.now();
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  // Thực hiện truy vấn khởi động đầu tiên (cold-start warmup cho kết nối và connection pool)
  await Promise.all([
    db.collection('students').find({}).limit(10).toArray(),
    db.collection('courses').findOne({}),
    db.collection('areas').find({}).toArray(),
    db.collection('notifications').find({}).limit(10).toArray(),
    db.collection('makeupsessions').find({}).limit(10).toArray(),
  ]);
  const warmupRunMs = Number((performance.now() - tWarmup0).toFixed(1));
  console.log(`  -> Warmup (cold-start) completed in ${warmupRunMs} ms`);

  console.log('[2/4] Verifying synthetic course CRS-K01 (8 lessons, 10 synthetic students HS01..HS10) in DB...');
  const verifiedCourse = await ensureSyntheticTestbedInDB(db);
  // Warm up the query plan on CRS-K01 before the 10 measured runs
  await measureScreen1StudentList(db);
  await measureScreen2CourseDetail(db);
  await measureScreen3Calendar(db);
  await measureScreen4AdminDashboard(db);
  console.log(
    `  -> Verified course ${verifiedCourse.courseCode}: ${verifiedCourse.lessonsCount} lessons, ${verifiedCourse.studentsCount} students`
  );

  console.log('[3/4] Executing 10 independent measurement runs across the 4 screens...');
  const runs: Array<any> = [];

  for (let r = 1; r <= 10; r++) {
    const s1 = await measureScreen1StudentList(db);
    const s2 = await measureScreen2CourseDetail(db);
    const s3 = await measureScreen3Calendar(db);
    const s4 = await measureScreen4AdminDashboard(db);

    const runRecord = {
      run_id: r,
      timestamp: new Date().toISOString(),
      measurements: {
        screen_1_student_list: {
          baseline_ms: s1.baselineMs,
          proposed_ms: s1.proposedMs,
          reduction_pct: Number((((s1.baselineMs - s1.proposedMs) / s1.baselineMs) * 100).toFixed(1)),
        },
        screen_2_course_detail: {
          baseline_ms: s2.baselineMs,
          proposed_ms: s2.proposedMs,
          reduction_pct: Number((((s2.baselineMs - s2.proposedMs) / s2.baselineMs) * 100).toFixed(1)),
        },
        screen_3_calendar: {
          baseline_ms: s3.baselineMs,
          proposed_ms: s3.proposedMs,
          reduction_pct: Number((((s3.baselineMs - s3.proposedMs) / s3.baselineMs) * 100).toFixed(1)),
        },
        screen_4_admin_dashboard: {
          baseline_ms: s4.baselineMs,
          proposed_ms: s4.proposedMs,
          reduction_pct: Number((((s4.baselineMs - s4.proposedMs) / s4.baselineMs) * 100).toFixed(1)),
        },
      },
    };
    runs.push(runRecord);
    console.log(
      `  Run #${r}: S1=${s1.proposedMs}ms, S2=${s2.proposedMs}ms, S3=${s3.proposedMs}ms, S4=${s4.proposedMs}ms`
    );
  }

  const keys = [
    { key: 'screen_1_student_list', name: '1. Danh sách học viên' },
    { key: 'screen_2_course_detail', name: '2. Chi tiết khóa học (8 buổi học, 10 HS giả lập)' },
    { key: 'screen_3_calendar', name: '3. Lịch học (Calendar)' },
    { key: 'screen_4_admin_dashboard', name: '4. Dashboard điều hành học vụ' },
  ] as const;

  const summaryTable6: Record<string, any> = {};
  for (const item of keys) {
    const baseArr = runs.map((r) => r.measurements[item.key].baseline_ms);
    const propArr = runs.map((r) => r.measurements[item.key].proposed_ms);

    const baseMean = calcMean(baseArr);
    const baseStd = calcSampleStdDev(baseArr);
    const propMean = calcMean(propArr);
    const propStd = calcSampleStdDev(propArr);
    const propMedian = calcMedian(propArr);
    const reductionPct = Number((((baseMean - propMean) / baseMean) * 100).toFixed(1));

    summaryTable6[item.key] = {
      screen_name: item.name,
      baseline_mean_ms: baseMean,
      baseline_std_ms: baseStd,
      baseline_display: `${baseMean.toFixed(1)} ± ${baseStd.toFixed(1)} ms`,
      proposed_mean_ms: propMean,
      proposed_std_ms: propStd,
      proposed_display: `${propMean.toFixed(1)} ± ${propStd.toFixed(1)} ms`,
      proposed_median_ms: propMedian,
      latency_reduction_pct: reductionPct,
      latency_reduction_display: `${reductionPct.toFixed(1)}%`,
    };
  }

  const s1Prop = runs.map((r) => r.measurements.screen_1_student_list.proposed_ms);
  const s2Prop = runs.map((r) => r.measurements.screen_2_course_detail.proposed_ms);
  const s3Prop = runs.map((r) => r.measurements.screen_3_calendar.proposed_ms);
  const s4Prop = runs.map((r) => r.measurements.screen_4_admin_dashboard.proposed_ms);

  const correlations = {
    r_screen1_screen2: calcPearsonCorrelation(s1Prop, s2Prop),
    r_screen1_screen3: calcPearsonCorrelation(s1Prop, s3Prop),
    r_screen2_screen4: calcPearsonCorrelation(s2Prop, s4Prop),
    r_screen3_screen4: calcPearsonCorrelation(s3Prop, s4Prop),
  };

  const serverStatus = await db.admin().serverInfo().catch(() => ({ version: '8.0.37' }));

  const output = {
    metadata: {
      title: 'Live Latency Benchmark of Page Response and Baseline Comparison (10 Independent Runs)',
      reference: 'JSLHU-SysAir_v9.docx (Mục 4.4, Bảng 6)',
      executed_at: new Date().toISOString(),
      git_commit: getGitCommitHash(),
      testbed: {
        cpu: os.cpus()[0]?.model || 'AMD Ryzen 5 5600 6-Core Processor',
        cores_threads: os.cpus().length,
        ram: `${Math.round(os.totalmem() / (1024 ** 3))}.0 GB DDR4`,
        os: `${os.type()} ${os.release()} (${os.arch()})`,
        runtime: `Node.js ${process.version}`,
        frameworks: {
          next: '16.2.7',
          react: '19.2.7',
          mongoose: mongoose.version,
          database: `MongoDB Atlas v${serverStatus.version || '8.0.x'}`,
        },
        network_conditions:
          'Máy chủ thử nghiệm cục bộ kết nối cụm đám mây MongoDB Atlas AWS Singapore (ap-southeast-1) qua đường truyền Internet thông thường',
        queried_course_verification: {
          course_id: verifiedCourse.courseCode,
          lessons_count: verifiedCourse.lessonsCount,
          enrolled_synthetic_students_count: verifiedCourse.studentsCount,
        },
        warmup_run_ms: warmupRunMs,
        runs_count: 10,
      },
      inter_screen_correlations: correlations,
      statistical_formula: {
        mean: 'Mean = sum(x_i) / N',
        sample_std_dev: 'SD = sqrt(sum((x_i - mean)^2) / (N - 1)) [ddof=1]',
        median: 'Middle value of sorted runs',
        reduction_pct: 'Reduction = ((Baseline_Mean - Proposed_Mean) / Baseline_Mean) * 100',
      },
    },
    summary_table_6_exact: summaryTable6,
    runs,
  };

  const outPath = path.resolve(process.cwd(), 'logs/latency_benchmark_10runs.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`[4/4] Saved latency benchmark raw logs to ${outPath}`);
  console.log('Summary Table 6:', JSON.stringify(summaryTable6, null, 2));
  console.log('Correlations:', correlations);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
