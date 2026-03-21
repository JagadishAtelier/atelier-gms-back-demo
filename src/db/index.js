// import { Sequelize  } from "sequelize"; 

// const sequelize = new Sequelize("mysql://root:root@192.168.1.150/hms");

// sequelize.authenticate().then((data)=> console.log("Database is Connected")).catch((err)=> console.log(`Error ${err}`))


// export { sequelize };




import { Sequelize } from "sequelize";

const sequelize = new Sequelize("mysql://u265115582_mygmsdatabase:Mygmsdatabase1@82.112.229.246/u265115582_MyGMSDataBase");
// const sequelize = new Sequelize("mysql://u265115582_gms:Parthiban2025@82.112.229.246/u265115582_gms");
// const sequelize = new Sequelize("mysql://root:root@localhost/gms");

sequelize
  .authenticate()
  .then(() => console.log("Database is Connected"))
  .catch((err) => console.error(`Database connection error: ${err}`));


export { sequelize };




