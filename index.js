const express = require('express');
const urlRoute = require('./routes/url');
const { connectMongoDB } = require('./connect');
const URL = require('./models/url');
const {restrictToLoggedinUserOnly, checkAuth} = require('./middleware/auth') ; 
const cookieParse = require('cookie-parser'); 
const app = express();
const PORT = 3001;
const mongoURL = "mongodb://127.0.0.1:27017/url-shorter";
const path = require('path'); 
const staticRoute = require('./routes/staticrouter') ; 
const userRoute = require('./routes/user') ; ;


connectMongoDB(mongoURL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.set("view engine" , "ejs") ; 
app.set('views', path.resolve('./views')) ; 

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cookieParse()); 




app.use("/" , checkAuth,  staticRoute ) ; 
app.use("/url" , restrictToLoggedinUserOnly ,  urlRoute ) ; 
app.use("/user" , userRoute ) ; 
 


app.get('/url/:shortID', async (req, res) => {
  const shortID = req.params.shortID;  
  try {
    const entry = await URL.findOneAndUpdate(
      { shortID },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
          },
        },
      }
    );

    if (!entry) return res.status(404).send("Short URL not found");

    res.redirect(entry.redirectURL);
  } catch (err) {
    console.error("Error during redirect:", err);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
