// import { sequelize } from "../src/db/index.js";


// async function syncDatabase() {
//   try {
//     await sequelize.sync({ alter: true });
//     console.log("Database synchronized successfully");
//   } catch (err) {
//     console.error("Error syncing database:", err.message);
//     throw err
//   }
// }

// syncDatabase().then((data) => console.log("synced")).catch((err)=> console.error("error"));


import { sequelize } from "../src/db/index.js";
import Plan  from "../src/gms/plan/models/plan.model.js";

async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully");
  } catch (err) {
    console.error("Error syncing database:", err.message);
    throw err;
  }
}

syncDatabase()
  .then(() => console.log("synced"))
  .catch((err) => console.error("error", err));
