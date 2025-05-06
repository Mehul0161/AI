const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  technology: {
    type: String,
    required: true,
    trim: true
  },
  files: [{
    path: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add pre-remove middleware to clean up references
projectSchema.pre('remove', async function(next) {
  try {
    // Remove project reference from user's projects array
    await this.model('User').updateOne(
      { _id: this.user },
      { $pull: { projects: this._id } }
    );
    next();
  } catch (error) {
    next(error);
  }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 