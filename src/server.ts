import app from "./app.js";
import "dotenv/config";
import { connectDatabase } from "./config/db.config";
import ENV_CONFIG from "./config/env.config.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]); 

// const PORT = 8003;
// const DB_URI = "mongodb://localhost:27017/BLOODCONNECT";
const PORT = ENV_CONFIG.PORT;
const DB_URI = ENV_CONFIG.DB_URI!!;

connectDatabase(DB_URI);

app.listen(PORT,() => {
    console.log(`Server is start at http://localhost:${PORT}`);
});
