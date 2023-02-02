var socket =io()

socket.on("connection",(sum)=>{
    console.log("successfully connected");
})

socket.on("new message",(msg)=>{
    console.log("message recieved")
    var p=document.createElement("p");
    p.style="position:-ms-page; width: 340.571px; height: 64px; border-radius: 10px; background-image: none; background-color: rgb(243, 238, 238); overflow:unset;"
    p.innerText=msg
    document.getElementById("white").appendChild(p)

})