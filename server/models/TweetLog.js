const mongoose = require('mongoose');

const tweetLogSchema = new mongoose.Schema({
  tweetId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'tweet_logs' });

// Nettoyer automatiquement les vieux logs après 30 jours
tweetLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 jours

module.exports = mongoose.model('TweetLog', tweetLogSchema);
