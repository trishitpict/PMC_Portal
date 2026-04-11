// In-memory maps for real-time targeting
// userId (string) → socketId
const userSocketMap = {};
// area (string) → Set of userIds
const areaUserMap = {};

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client must emit 'join' with { userId, area } after connecting
    socket.on('join', ({ userId, area }) => {
      if (!userId) return;

      // Map userId → socketId
      userSocketMap[userId] = socket.id;

      // Map area → Set of userIds
      if (area) {
        if (!areaUserMap[area]) areaUserMap[area] = new Set();
        areaUserMap[area].add(userId);
      }

      console.log(`User ${userId} (area: ${area}) joined → socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      // Clean up maps on disconnect
      for (const [uid, sid] of Object.entries(userSocketMap)) {
        if (sid === socket.id) {
          delete userSocketMap[uid];

          // Remove from area map
          for (const area of Object.keys(areaUserMap)) {
            areaUserMap[area].delete(uid);
            if (areaUserMap[area].size === 0) delete areaUserMap[area];
          }

          console.log(`User ${uid} disconnected`);
          break;
        }
      }
    });
  });
};

// Emit to a single user by userId
const emitToUser = (io, userId, eventName, data) => {
  const socketId = userSocketMap[String(userId)];
  if (socketId) {
    io.to(socketId).emit(eventName, data);
  }
};

// Emit to all connected users in a given area
const emitToArea = (io, area, eventName, data) => {
  const users = areaUserMap[area];
  if (users) {
    users.forEach((userId) => {
      const socketId = userSocketMap[userId];
      if (socketId) {
        io.to(socketId).emit(eventName, data);
      }
    });
  }
};

module.exports = { initSocket, emitToUser, emitToArea };
