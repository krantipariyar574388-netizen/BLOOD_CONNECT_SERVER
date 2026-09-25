import mongoose from "mongoose";

export const connectDatabase = (DB_URI :string) => {
    mongoose
    .connect(DB_URI,{
        autoCreate : true,
        dbName : "BLOODCONNECT",
    })
    .then(() => {
        console.log("Database connected!");
    })
    .catch((error) => {
    console.log("Database connection error:", error.message);
    console.error(error);
});
};