import { Schema, model, models } from 'mongoose'

const bankSchema = new Schema({
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true })

const Bank = models.bank || model('bank', bankSchema)
export default Bank
