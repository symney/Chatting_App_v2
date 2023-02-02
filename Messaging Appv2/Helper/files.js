var fs=require("fs");  
var async=require("async");
var http=require("http");
var express=require("express");
var app=express();


exports.fileread= (file,callback)=>{
    async.waterfall([
        (callback)=>{
            console.log("opening file");
            fs.readFile(file,callback);
        },
        (text,callback)=>{
            callback(null,text.toString("utf8"));
        }],
        (err,text)=>{
            if(err){
                callback(err,null);
                return
            }
            callback(null,text);
        }
    );
    }

    exports.stat_req=(file,res)=>{
        var rs=fs.createReadStream(file);
        rs.on("error",(e)=>{
            res.end("error"+e);
            return
        })
        rs.pipe(res);
    }








    