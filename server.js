var express = require('express');
var mysql = require('./db.js');
var handlebars = require('express-handlebars').create({defaultLayout: 'main'});

var app = express();
app.use(express.static('public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 7000);

app.get('/', function (req, res, next) {
  var context = {};
  mysql.pool.query('SELECT s.id, s.name, classification, p.name AS program, startDate, endDate FROM spacecraft s \
                    LEFT JOIN program p ON s.pid = p.id ORDER BY startDate ASC', function (err, results, fields) {
      if (err) { return next(err); }
      for (var i = 0; i < results.length; ++i) {
        if (results[i].startDate == ("0000-00-00")) {
          results[i].startDate = "";
        }
        if (results[i].endDate == "0000-00-00") {
          results[i].endDate = "Ongoing";
        }
      }
      context.results = results;

      mysql.pool.query('SELECT id, name FROM program', function (err, results, fields) {
        if (err) { return next(err); }
        context.program = results;
        res.render('home', context);
      });
    });
});

app.get('/filter-spacecraft', function (req, res, next) {
  var context = {};
  mysql.pool.query('SELECT s.id, s.name, classification, p.name AS program, startDate, endDate FROM spacecraft s \
                    LEFT JOIN program p ON s.pid = p.id \
                    WHERE s.pid = ?', [req.query.pid], function (err, results, fields) {
      if (err) { return next(err); }
      for (var i = 0; i < results.length; ++i) {
        if (results[i].startDate == ("0000-00-00")) {
          results[i].startDate = "";
        }
        if (results[i].endDate == "0000-00-00") {
          results[i].endDate = "Ongoing";
        }
      }
      context.results = results;

      mysql.pool.query('SELECT id, name FROM program', function (err, results, fields) {
        if (err) { return next(err); }
        context.program = results;
        res.render('home', context);
      });
    });
});

app.get('/rockets', function (req, res, next) {
  var context = {};
  mysql.pool.query('SELECT * from rocket \
                    ORDER BY model ASC', function (err, results, fields) {
      if (err) { return next(err); }
      context.results = results;
      res.render('rockets', context);
    });
});

app.get('/insert-spacecraft', function (req, res, next) {
  mysql.pool.query('SELECT EXISTS(SELECT 1 FROM spacecraft WHERE name = ?) AS COUNT', [req.query.name], function (err, results, fields) {
    if (results[0].COUNT) {
      res.send("dup");
      return;
    } else {
      if (req.query.pid) {
        mysql.pool.query('INSERT INTO spacecraft (name, classification, pid, startDate, endDate) VALUES (?, ?, ?, ?, ?)',
          [req.query.name, req.query.classification, req.query.pid, req.query.startDate, req.query.endDate], function (err, results, fields) {
            if (err) { return next(err); }
            res.send(JSON.stringify(results));
          });
      } else {
        mysql.pool.query('INSERT INTO spacecraft (name, classification, startDate, endDate) VALUES (?, ?, ?, ?)',
          [req.query.name, req.query.classification, req.query.startDate, req.query.endDate], function (err, results, fields) {
            if (err) { return next(err); }
            res.send(JSON.stringify(results));
          });
      }
    }
  });
});

app.get('/update', function (req, res, next) {
  var context = {};

  mysql.pool.query('SELECT s.id, s.pid, s.name, classification, p.name AS program, startDate, endDate FROM spacecraft s \
                    LEFT JOIN program p ON s.pid = p.id \
                    WHERE s.id = ?', [req.query.id], function (err, results, fields) {
    if (err) { return next(err); }
    context.results = results[0];

    mysql.pool.query('SELECT id, name FROM program \
                     WHERE id NOT IN (IFNULL((SELECT pid FROM spacecraft WHERE id = ?), 0))', [req.query.id], function (err, results, fields) {
      if (err) { return next(err); }
      context.program = results;
      res.render('update', context);
    });
  });
});

app.get('/update-complete', function (req, res, next) {
  if (req.query.pid) {
    mysql.pool.query("UPDATE spacecraft SET name=?, classification=?, pid=?, startDate=?, endDate=? WHERE id=? ",
      [req.query.name, req.query.classification, req.query.pid, req.query.startDate, req.query.endDate, req.query.id], function (err, results, fields) {
        if (err) { return next(err); }
        res.redirect(302, '/');
      });
  } else {
    mysql.pool.query("UPDATE spacecraft SET name=?, classification=?, startDate=?, endDate=? WHERE id=? ",
      [req.query.name, req.query.classification, req.query.startDate, req.query.endDate, req.query.id], function (err, results, fields) {
        if (err) { return next(err); }
        res.redirect(302, '/');
      });
  }
});

app.get('/delete', function (req, res, next) {
  mysql.pool.query("DELETE FROM spacecraft WHERE id = ?", [req.query.id], function (err, result) {
    if (err) { return next(err); }
  });
});

app.use(function (req, res) {
  res.status(404);
  res.render('404');
});

app.use(function (err, req, res, next) {
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function () {
  console.log('Express started on port ' + app.get('port') + '; press Ctrl-C to terminate.');
});