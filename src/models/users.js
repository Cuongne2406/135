import Zalo from '@/app/client/ui/zalo'
import { Schema, model, models } from 'mongoose'

const postUser = new Schema({
  name: {
    type: String,
  },
  address: {
    type: String,
  },
  avt: {
    type: String,
  },
  role: {
    type: Array,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  uid: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  zalo: {
    type: Schema.Types.ObjectId, ref: 'zaloaccount'
  },
}, { timestamps: true })

const users = models.user || model('user', postUser)

export default users