var express=require('express');
const fs = require('fs');

var app=express();
var bodyparser=require('body-parser');
const AWS=require('aws-sdk');

const BUCKET_NAME = '';
const IAM_USER_KEY = '';
const IAM_USER_SECRET = '';

var urlencodedParser=bodyparser.urlencoded({extended:false});
app.set('view engine', 'ejs');

app.get('/po/:po_id',function(req,res){
   data={msg:'',po:req.params.po_id};
   res.render('index',data);
});
app.post('/delete/:po_id',urlencodedParser,function(req, res) {
    
    
    let s3 = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
        Bucket: BUCKET_NAME
      });
      

      var MongoClient = require('mongodb').MongoClient;
      var url = "mongodb+srv://root:root@cluster0-xhbwk.mongodb.net/test?retryWrites=true&w=majority";
      MongoClient.connect(url,{ useUnifiedTopology: true}, function(err, db) {
      if (err) throw err;
      var dbo = db.db("internship");
      


      dbo.collection("purchase").findOne({_id: Number(req.params.po_id)}, function(err, result) {
            if (err) throw err;
         
            var params = {
                Bucket: BUCKET_NAME, 
                Delete: { 
                    Objects: [ 
                      {
                        Key: result.item_image.split('/').slice(-1)[0]
                      },
                      {
                          Key: result.prod_spec.split('/').slice(-1)[0]
                      }
                      
                    ],
                  },
                };
                s3.deleteObjects(params, function(err, data) {
                    if (err) console.log(err, err.stack); 
                    else     console.log("deleted");           
                  });


                  dbo.collection("purchase").deleteOne({_id: Number(req.params.po_id)}, function(err, res) {
                    if (err) throw err;
                    console.log("1 document deleted");
                });
    
                });
                data={msg:'Purchase Deleted',po:''};
    
                res.render('index',data);

        });


           
});


app.post('/check', urlencodedParser,function(req, res){

    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb+srv://root:root@cluster0-xhbwk.mongodb.net/test?retryWrites=true&w=majority";
    MongoClient.connect(url,{ useUnifiedTopology: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("internship");

    dbo.collection("purchase").find({_id:Number(req.body.po_id1)}).count(function (err, result) {
        if (err) throw err;
        if(result==0){
            data={msg:'Purchase ID Not Present',po:''};
            res.render('index',data);
            db.close();
        }
        else{
            dbo.collection("purchase").findOne({_id: Number(req.body.po_id1)}, function(err, resp) {
                if (err) throw err;
                res.render('main',{data: resp});
            });
            
         }
    });

    });
});

app.post('/main', urlencodedParser,function(req, res){
    
        var MongoClient = require('mongodb').MongoClient;
        var url = "mongodb+srv://root:root@cluster0-xhbwk.mongodb.net/test?retryWrites=true&w=majority";
        MongoClient.connect(url,{ useUnifiedTopology: true}, function(err, db) {
        if (err) throw err;
        var dbo = db.db("internship");

        dbo.collection("purchase").find({_id:Number(req.body.po_id)}).count(function (err, result) {
            if (err) throw err;
            if(result==1){
                data={msg:'Purchase ID Already Present',po:''};
                res.render('index',data);
            }
            else{
                let s3 = new AWS.S3({
                    accessKeyId: IAM_USER_KEY,
                    secretAccessKey: IAM_USER_SECRET,
                    Bucket: BUCKET_NAME
                  });
            
                  const image = req.body.po_id+req.body.img;

                  var imageloc;
                  fs.readFile(req.body.img, (err, data) => {
                  if (err) throw err;
                  const params = {
                  Bucket: BUCKET_NAME, 
                  Key: image, 
                  Body: JSON.stringify(data, null, 2)
                  };
                  s3.upload(params, function(s3Err, data) {
                  if (s3Err) throw s3Err
                  console.log(`File uploaded successfully at ${data.Location}`);
                  imageloc=data.Location;
                 
                  });
                  });
            

                    const fileName = req.body.po_id+req.body.pdf;

                    var pdfloc;
            
                    fs.readFile(req.body.pdf, (err, data) => {
                    if (err) throw err;
                    const params = {
                    Bucket: BUCKET_NAME, 
                    Key: fileName, 
                    Body: JSON.stringify(data, null, 2)
                    };
                    s3.upload(params, function(s3Err, data) {
                    if (s3Err) throw s3Err
                    console.log(`File uploaded successfully at ${data.Location}`);

                    pdfloc=data.Location;
                        process();
                    });
                
                    });

            function process(){
                var myobj = {_id: Number(req.body.po_id), purchase_date: req.body.date, item_name: req.body.item , unit_price:Number(req.body.unit_price),quantity:Number(req.body.quantity),cost:req.body.unit_price*req.body.quantity, item_image:imageloc,prod_spec:pdfloc};
                dbo.collection("purchase").insertOne(myobj, function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                    db.close();

                });
                res.render('main',{data: myobj});
        
                }
            }
        });

        });
    });

    

app.post('/updatedate/:id', urlencodedParser,function(req, res){
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb+srv://root:root@cluster0-xhbwk.mongodb.net/test?retryWrites=true&w=majority";
    MongoClient.connect(url,{ useUnifiedTopology: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("internship");
    var newdate={ $set: {purchase_date: req.body.date}};

    dbo.collection("purchase").updateOne({_id:Number(req.params.id)},newdate,function(err, res) {
        if (err) throw err;
        console.log("1 document updated");
        
        db.close();
      });

      dbo.collection("purchase").findOne({_id: Number(req.params.id)}, function(err, resp) {
        if (err) throw err;
        console.log(resp.purchase_date);
        res.render('main',{data: resp});
    });
});

});

app.post('/updateprice/:id', urlencodedParser,function(req, response){
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb+srv://root:root@cluster0-xhbwk.mongodb.net/test?retryWrites=true&w=majority";
    MongoClient.connect(url,{ useUnifiedTopology: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("internship");
    dbo.collection("purchase").findOne({_id:Number(req.params.id)},function(err, result) {
        if (err) throw err;
        var newprice={ $set: {unit_price: Number(req.body.price), cost: Number(Number(req.body.price)*Number(result.quantity))}};

        dbo.collection("purchase").updateOne({_id:Number(req.params.id)},newprice,function(err, res) {
            if (err) throw err;
            console.log("1 document updated");

            dbo.collection("purchase").findOne({_id: Number(req.params.id)}, function(err, resp) {
                if (err) throw err;
                response.render('main',{data: resp});
            });
          });  
      }); 
});
});



app.post('/updatequantity/:id', urlencodedParser,function(req, response){
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb+srv://root:root@cluster0-xhbwk.mongodb.net/test?retryWrites=true&w=majority";
    MongoClient.connect(url,{ useUnifiedTopology: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("internship");
    dbo.collection("purchase").findOne({_id:Number(req.params.id)},function(err, result) {
        if (err) throw err;
        var newquantity={ $set: {quantity: Number(req.body.quantity), cost: Number(Number(req.body.quantity)*Number(result.unit_price))}};

        dbo.collection("purchase").updateOne({_id:Number(req.params.id)},newquantity,function(err, res) {
            if (err) throw err;
            console.log("1 document updated");

            dbo.collection("purchase").findOne({_id: Number(req.params.id)}, function(err, resp) {
                if (err) throw err;
                response.render('main',{data: resp});
            });
          });  
      }); 
});


});

app.listen(3000);