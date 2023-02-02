var page="sdfg";
var userinfo={};
console.log("bootstrap activated");

$.get("./data/front/html/chat.html",(temp)=>{
        page=temp;
})

$.get("./api/user",(ud)=>{
    userinfo=JSON.parse(ud)
})


$(document).ajaxStop(()=>{
  var finalpage=Mustache.to_html(page,userinfo)
  $("body").html(finalpage);
})