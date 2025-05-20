app.get('/', (req, res) => {
  const search = req.query.search || '';
  const sort = req.query.sort || '';

  let sql = 'SELECT * FROM houses';
  const params = [];

  if (search) {
    sql += ' WHERE name LIKE ? OR location LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sort === 'low') {
    sql += ' ORDER BY price ASC';
  } else if (sort === 'high') {
    sql += ' ORDER BY price DESC';
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.send('Database error');
    } else {
      res.render('index', { houses: rows, search, sort });
    }
  });
});