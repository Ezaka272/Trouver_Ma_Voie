require("dotenv").config(); 
const app=require("./app");
 const {initDb}=require("./config/initDb");
  const PORT=process.env.PORT||3000;
(async()=>{try{await initDb();
    app.listen(PORT,"0.0.0.0",()=>console.log(`TaxiBe lancé sur http://localhost:${PORT}`));
}catch(e){
    console.error("Impossible de démarrer TaxiBe:",e);process.exit(1);}})();
