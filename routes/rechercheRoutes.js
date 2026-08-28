const express=require("express"); 
const db=require("../config/db"); 
const {requireAuth}=require("../middlewares/auth"); 
const router=express.Router();

router.post("/",async(req,res,next)=>{
    try{
    const depart=String(req.body.depart||"").trim();
    const destination=String(req.body.destination||"").trim();

    if(!depart||!destination)return res.status(400).json({message:"Départ et destination requis"});

    await db.query("INSERT INTO recherches(utilisateur_id,depart,destination) VALUES(?,?,?)",
    [req.user?.id||null,depart,destination]);
    res.status(201).json({ok:true})}catch(e){next(e)}});
router.get("/me",requireAuth,async(req,res,next)=>{
    try{const [r]=await db.query("SELECT id,depart,destination,created_at FROM recherches WHERE utilisateur_id=? ORDER BY created_at DESC LIMIT 20",[req.user.id]);res.json(r)}catch(e){next(e)}});
module.exports=router;
