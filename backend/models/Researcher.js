const mongoose = require('mongoose');

const researcherSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  userType: {
    type: String,
    default: 'researcher',
    enum: ['researcher'],
  },
  education: {
    highestDegree: {
      type: String,
      required: true,
    },
    fieldOfStudy: {
      type: String,
      required: true,
    },
    institution: {
      type: String,
      required: true,
    },
    graduationYear: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    certifications: {
      type: String,
      default: '',
    },
  },
  orcid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // lazy-load to avoid circular require
        const { isValidOrcid } = require('../utils/orcid');
        return isValidOrcid(v);
      },
      message: props => `${props.value} is not a valid ORCID identifier`,
    },
  },
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  verifiedBy: {
    type: String,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Researcher = mongoose.model('Researcher', researcherSchema);

module.exports = Researcher;

