import express from "express";
var indexRouter = express.Router();

indexRouter.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

export default indexRouter;

