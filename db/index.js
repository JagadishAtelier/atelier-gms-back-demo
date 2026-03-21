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
import companyModel from "../src/gms/Company/Models/Company.js";
import companyOTPModel from "../src/gms/Company/Models/otp.model.js";
import user from "../src/user/models/user.model.js";

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
