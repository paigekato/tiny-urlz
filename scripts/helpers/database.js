module.exports = function saveToCollection(collection, item, res) {
  db.collection(collection).save(item, (err, result) => {
    if (err) {
      return console.log(err);
    };

    res.redirect('/urls');
  });
}