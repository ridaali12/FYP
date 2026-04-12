const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text:      { type: String,  required: true },
  user:      { type: String,  required: true },
  userId:    { type: String,  required: true },
  timestamp: { type: Date,    default: Date.now },
  pinned:    { type: Boolean, default: false },
});

const reportSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  specieName: {
    type: String,
    required: true,
  },
  healthStatus: {
    type: String,
    required: true,
    enum: ['Healthy', 'Injured', 'Sick', 'Hungry'],
  },
  location: {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
  },

  // ✅ Weather data — auto-captured during report submission
  weatherConditions: {
    temperature:  { type: String, default: null },
    feelsLike:    { type: String, default: null },
    condition:    { type: String, default: null },
    description:  { type: String, default: null },
    humidity:     { type: String, default: null },
    windSpeed:    { type: String, default: null },
    visibility:   { type: String, default: null },
    pressure:     { type: String, default: null },
    capturedAt:   { type: String, default: null },
    researchNote: { type: String, default: null },
    behaviorHint: { type: String, default: null },
  },

  timestamp: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    default: 'anonymous',
  },
  username: {
    type: String,
    default: 'Unknown User',
  },
  comments:    [commentSchema],
  isSpam:      { type: Boolean, default: false },
  isInappropriate: { type: Boolean, default: false },
  flaggedBy:   { type: String,  default: null },
  flaggedAt:   { type: Date,    default: null },
  deletedBy:   { type: String,  default: null },
  deletedAt:   { type: Date,    default: null },
  createdAt:   { type: Date,    default: Date.now },
  pinnedComment: { type: commentSchema, default: null },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;