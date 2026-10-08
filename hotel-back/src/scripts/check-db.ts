import { db } from "../db.js";

async function inspect() {
  const [rooms]: any = await db.query("SELECT id, name, room_number, floor, org_id, org_name, status, available, is_deleted FROM rooms");
  console.log("Rooms count:", rooms.length);
  console.table(rooms);
  const [floors]: any = await db.query("SELECT * FROM branch_floors");
  console.log("Floors count:", floors.length);
  console.table(floors);
  const [numbers]: any = await db.query("SELECT * FROM floor_room_numbers");
  console.log("Floor room numbers count:", numbers.length);
  console.table(numbers);
  await db.end();
}

inspect().catch(console.error);
