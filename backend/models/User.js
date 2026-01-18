const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
  type: Boolean,
  default: false,
  index: true
},
deletedAt: {
  type: Date,
  default: null
}
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

/// ✅ OR use this async version (remove 'next' parameter)
UserSchema.pre('save', async function() {
  // Only hash if password is modified or new
  if (!this.isModified('passwordHash')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (error) {
    throw error; // Mongoose will catch this
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Add before module.exports in User.js:
UserSchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, isDeleted: false });
};

UserSchema.statics.findOneActive = function(query = {}) {
  return this.findOne({ ...query, isDeleted: false });
};

UserSchema.statics.findDeleted = function(query = {}) {
  return this.findOne({ ...query, isDeleted: true });
};

UserSchema.methods.isActive = function() {
  return !this.isDeleted;
};

module.exports = mongoose.model('User', UserSchema);