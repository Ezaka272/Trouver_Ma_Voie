const express=require("express");
const db=require("../config/db"); 
const {requireAdmin}=require("../middlewares/auth");
const router=express.Router();
router.get("/",requireAdmin,async(req,res,next)=>{try{
    const [[l]] = await db.query("SELECT COUNT(*) n FROM ligne");
     const [[a]]=await db.query("SELECT COUNT(*) n FROM arret");
      const [[r]]=await db.query("SELECT COUNT(*) n FROM recherches");
       const [[f]]=await db.query("SELECT COUNT(*) n FROM favoris");
        const [recent]=await db.query("SELECT id,numero,depart,destination FROM ligne ORDER BY id DESC LIMIT 5"); res.json({lignes:Number(l.n),arrets:Number(a.n),recherches:Number(r.n),favoris:Number(f.n),recentes:recent})}catch(e){next(e)}}); module.exports=router;
