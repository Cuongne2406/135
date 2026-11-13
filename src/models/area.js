import { Schema, model, models } from 'mongoose'

const RoomSchema = new Schema(
  { name: { type: String, required: true, trim: true }},
  { _id: true }
)

const AreaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    rooms: { type: [RoomSchema], default: [] },
    color: { type: String, trim: true }
  },
  { timestamps: true }
)

const Area = models.Area || models.area || model('area', AreaSchema);
if (!models.Area) {
  try { model('Area', AreaSchema); } catch (_) {}
}
export default Area;
