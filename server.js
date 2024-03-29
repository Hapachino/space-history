var express = require('express');
var mysql = require('./db.js');
var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });

var app = express();
app.use(express.static('public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 6999);

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
        res.render('spacecraft', context);
      });
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

app.get('/filter-spacecraft', function (req, res, next) {
  var context = {};
  if (!req.query.pid) {
    res.redirect(302, "/");
  } else {
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
          res.render('spacecraft', context);
        });
      });
  }
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

app.get('/delete-spacecraft', function (req, res, next) {
  mysql.pool.query("DELETE FROM spacecraft WHERE id = ?", [req.query.id], function (err, result) {
    if (err) { return next(err); }
  });
});

app.get('/spacecraft-info', function (req, res, next) {
  var context = {};
  mysql.pool.query('SELECT s.id, s.name, classification, p.name AS program, startDate, endDate FROM spacecraft s \
                    LEFT JOIN program p ON s.pid = p.id \
                    WHERE s.name = ? \
                    ORDER BY startDate ASC', [req.query.name], function (err, results, fields) {
      if (err) { return next(err); }
      for (var i = 0; i < results.length; ++i) {
        if (results[i].startDate == ("0000-00-00")) {
          results[i].startDate = "";
        }
        if (results[i].endDate == "0000-00-00") {
          results[i].endDate = "Ongoing";
        }
      }
      context.results = results[0];

      mysql.pool.query('SELECT model, height, stages, thrust, r.id AS id FROM rocket r \
                        INNER JOIN launch l on r.id = l.rid \
                        INNER JOIN spacecraft s ON s.id = l.sid \
                        WHERE s.name = ?', [req.query.name], function (err, results, fields) {
          if (err) { return next(err); }
          context.rocket = results;

          mysql.pool.query('SELECT * FROM program \
                        WHERE id = (SELECT pid FROM spacecraft WHERE name = ?)', [req.query.name], function (err, results, fields) {
              if (err) { return next(err); }
              for (var i = 0; i < results.length; ++i) {
                if (results[i].startYear == ("0000")) {
                  results[i].startYear = "";
                }
                if (!results[i].endYear || results[i].endYear == "0000") {
                  results[i].endYear = "Ongoing";
                }
              }
              context.pid = results;

              mysql.pool.query('SELECT a.id, a.name, a.classification, a.diameter, a.mass, a.au, a.moons, b.name AS orbiting FROM space a \
                        LEFT JOIN space b ON a.orbits = b.id \
                        INNER JOIN explore e ON a.id = e.sid \
                        INNER JOIN spacecraft s ON e.scid = s.id \
                        WHERE s.name = ? \
                        ORDER BY au ASC, mass DESC;', [req.query.name], function (err, results, fields) {
                  if (err) { return next(err); }
                  for (var i = 0; i < results.length; ++i) {
                    results[i].diameter = results[i].diameter || "";
                    results[i].mass = results[i].mass || "";
                    results[i].au = results[i].au || "";
                    results[i].moons = results[i].moons || "";
                  }
                  context.space = results;

                  mysql.pool.query('SELECT id, name FROM program \
                     WHERE id NOT IN (IFNULL((SELECT pid FROM spacecraft WHERE id = ?), 0))', [req.query.id], function (err, results, fields) {
                      if (err) { return next(err); }
                      context.program = results;
                      res.render('spacecraft-info', context);
                    });
                });
            });
        });
    });
});

app.get('/delete-spacecraft-info', function (req, res, next) {
  mysql.pool.query("DELETE FROM launch WHERE rid = ?", [req.query.id], function (err, result) {
    if (err) { return next(err); }
  });
});

app.get('/rocket', function (req, res, next) {
  var context = {};
  mysql.pool.query('SELECT * FROM rocket \
                    ORDER BY model ASC', function (err, results, fields) {
      if (err) { return next(err); }
      context.results = results;

      mysql.pool.query('SELECT DISTINCT stages FROM rocket ORDER BY stages ASC', function (err, results, fields) {
        if (err) { return next(err); }
        context.stages = results;
        res.render('rocket', context);
      });
    });
});

app.get('/insert-rocket', function (req, res, next) {
  mysql.pool.query('SELECT EXISTS(SELECT 1 FROM rocket WHERE model = ?) AS COUNT', [req.query.model], function (err, results, fields) {
    if (results[0].COUNT) {
      res.send("dup");
      return;
    } else {
      mysql.pool.query('INSERT INTO rocket (model, height, stages, thrust) VALUES (?, ?, ?, ?)',
        [req.query.model, req.query.height, req.query.stages, req.query.thrust], function (err, results, fields) {
          if (err) { return next(err); }
          res.send(JSON.stringify(results));
        });
    }
  });
});

app.get('/filter-rocket', function (req, res, next) {
  var context = {};
  if (!req.query.stages) {
    res.redirect(302, "/rocket");
  } else {
    mysql.pool.query('SELECT * FROM rocket WHERE stages = ? ORDER BY MODEL ASC', [req.query.stages], function (err, results, fields) {
      if (err) { return next(err); }
      context.results = results;

      mysql.pool.query('SELECT DISTINCT stages FROM rocket ORDER BY stages ASC', function (err, results, fields) {
        if (err) { return next(err); }
        context.stages = results;
        res.render('rocket', context);
      });
    });
  }
});

app.get('/delete-rocket', function (req, res, next) {
  mysql.pool.query("DELETE FROM rocket WHERE id = ?", [req.query.id], function (err, result) {
    if (err) { return next(err); }
  });
});

app.get('/program', function (req, res, next) {
  var context = {};
  mysql.pool.query('SELECT * FROM program \
                    ORDER BY startYear ASC', function (err, results, fields) {
      if (err) { return next(err); }
      for (var i = 0; i < results.length; ++i) {
        if (results[i].startYear == ("0000")) {
          results[i].startYear = "";
        }
        if (!results[i].endYear || results[i].endYear == "0000") {
          results[i].endYear = "Ongoing";
        }
      }
      context.results = results;

      mysql.pool.query('SELECT DISTINCT country FROM program ORDER BY country ASC', function (err, results, fields) {
        if (err) { return next(err); }
        context.country = results;
        res.render('program', context);
      });
    });
});

app.get('/insert-program', function (req, res, next) {
  mysql.pool.query('SELECT EXISTS(SELECT 1 FROM program WHERE name = ?) AS COUNT', [req.query.name], function (err, results, fields) {
    if (results[0].COUNT) {
      res.send("dup");
      return;
    } else {
      mysql.pool.query('INSERT INTO program (name, country, startYear, endYear) VALUES (?, ?, ?, ?)',
        [req.query.name, req.query.country, req.query.startYear, req.query.endYear], function (err, results, fields) {
          if (err) { return next(err); }
          res.send(JSON.stringify(results));
        });
    }
  });
});

app.get('/filter-program', function (req, res, next) {
  var context = {};
  if (!req.query.country) {
    res.redirect(302, "/program");
  } else {
    mysql.pool.query('SELECT * FROM program WHERE country = ? ORDER BY startYear ASC', [req.query.country], function (err, results, fields) {
      if (err) { return next(err); }
      for (var i = 0; i < results.length; ++i) {
        if (results[i].startYear == ("0000")) {
          results[i].startYear = "";
        }
        if (!results[i].endYear || results[i].endYear == "0000") {
          results[i].endYear = "Ongoing";
        }
      }
      context.results = results;

      mysql.pool.query('SELECT DISTINCT country FROM program ORDER BY startYear ASC', function (err, results, fields) {
        if (err) { return next(err); }
        context.country = results;
        res.render('program', context);
      });
    });
  }
});

app.get('/delete-program', function (req, res, next) {
  mysql.pool.query("DELETE FROM program WHERE id = ?", [req.query.id], function (err, result) {
    if (err) { return next(err); }
  });
});

app.get('/space', function (req, res, next) {
  var context = {};
  mysql.pool.query('SELECT a.id, a.name, a.classification, a.diameter, a.mass, a.au, a.moons, b.name AS orbiting FROM space a \
                    LEFT JOIN space b ON a.orbits = b.id \
                    ORDER BY au ASC, mass DESC;', function (err, results, fields) {
      if (err) { return next(err); }
      for (var i = 0; i < results.length; ++i) {
        results[i].diameter = results[i].diameter || "";
        results[i].mass = results[i].mass || "";
        results[i].au = results[i].au || "";
        results[i].moons = results[i].moons || "";
      }
      context.results = results;

      mysql.pool.query('SELECT DISTINCT name, id FROM space \
                        ORDER BY au', function (err, results, fields) {
          if (err) { return next(err); }
          context.names = results;

          mysql.pool.query('SELECT DISTINCT classification FROM space ORDER BY classification DESC', function (err, results, fields) {
            if (err) { return next(err); }
            context.classification = results;
            res.render('space', context);
          });
        });
    });
});

app.get('/insert-space', function (req, res, next) {
  mysql.pool.query('SELECT EXISTS(SELECT 1 FROM space WHERE name = ?) AS COUNT', [req.query.name], function (err, results, fields) {
    if (results[0].COUNT) {
      res.send("dup");
      return;
    } else {
      if (!req.query.orbits) {
        mysql.pool.query('INSERT INTO space (name, classification, diameter, mass, au, moons) VALUES (?, ?, ?, ?, ?, ?)',
          [req.query.name, req.query.classification, req.query.diameter, req.query.mass, req.query.au, req.query.moons], function (err, results, fields) {
            if (err) { return next(err); }
            res.send(JSON.stringify(results));
          });
      } else {
        mysql.pool.query('INSERT INTO space (name, classification, diameter, mass, au, moons, orbits) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.query.name, req.query.classification, req.query.diameter, req.query.mass, req.query.au, req.query.moons, req.query.orbits], function (err, results, fields) {
            if (err) { return next(err); }
            res.send(JSON.stringify(results));
          });
      }
    }
  });
});

app.get('/filter-space', function (req, res, next) {
  var context = {};
  if (!req.query.classification) {
    res.redirect(302, "/space");
  } else {
    mysql.pool.query('SELECT a.id, a.name, a.classification, a.diameter, a.mass, a.au, a.moons, b.name AS orbiting FROM space a \
                    LEFT JOIN space b ON a.orbits = b.id \
                    WHERE a.classification = ? \
                    ORDER BY au ASC, mass DESC', [req.query.classification], function (err, results, fields) {
        if (err) { return next(err); }
        for (var i = 0; i < results.length; ++i) {
          results[i].diameter = results[i].diameter || "";
          results[i].mass = results[i].mass || "";
          results[i].au = results[i].au || "";
          results[i].moons = results[i].moons || "";
        }
        context.results = results;

        mysql.pool.query('SELECT DISTINCT classification FROM space ORDER BY classification DESC', function (err, results, fields) {
          if (err) { return next(err); }
          context.classification = results;
          res.render('space', context);
        });
      });
  }
});

app.get('/delete-space', function (req, res, next) {
  mysql.pool.query("DELETE FROM space WHERE id = ?", [req.query.id], function (err, result) {
    if (err) { return next(err); }
  });
});

app.get('/relationships', function (req, res, next) {
  var context = {};  

  mysql.pool.query('SELECT name FROM spacecraft', function (err, results, fields) {
    if (err) { return next(err); }
    context.spacecraft = results;

    mysql.pool.query('SELECT model FROM rocket', function (err, results, fields) {
      if (err) { return next(err); }
      context.rocket = results;

      mysql.pool.query('SELECT name FROM space \
                        ORDER BY au', function (err, results, fields) {
        if (err) { return next(err); }
        context.space = results;
        res.render('relationships', context);
      });
    });
  });
});

app.get('/relationships-update', function (req, res, next) {
  if (req.query.model) {
    
    mysql.pool.query("INSERT INTO launch VALUES ((SELECT id FROM spacecraft WHERE name = ?), (SELECT id FROM rocket WHERE model = ?))",
      [req.query.name, req.query.model], function (err, results, fields) {
        if (err && err.code != "ER_DUP_ENTRY") { return next(err); }
        res.redirect(302, '/spacecraft-info?name=' + req.query.name);
      });
  } else {
    mysql.pool.query("INSERT INTO explore VALUES ((SELECT id FROM spacecraft WHERE name = ?), (SELECT id FROM space WHERE name = ?)) ",
      [req.query.spacecraft, req.query.space], function (err, results, fields) {
        if (err && err.code != "ER_DUP_ENTRY") { return next(err); }
        res.redirect(302, '/spacecraft-info?name=' + req.query.spacecraft);
      });
  }
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