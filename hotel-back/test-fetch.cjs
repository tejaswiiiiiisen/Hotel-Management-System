
const http = require("http");
http.get("http://localhost:4000/api/rooms?orgId=AS435", (res) => {
  let data = "";
  res.on("data", (c) => data += c);
  res.on("end", () => {
    const json = JSON.parse(data);
    const rooms = json.allRooms || json.rooms || json || [];
    console.log("Rooms:", rooms.map(r => ({
      id: r.id, name: r.name, roomNumber: r.roomNumber, room_number: r.room_number, number: r.number, type: r.type, title: r.title
    })).slice(0, 3));
  });
});

