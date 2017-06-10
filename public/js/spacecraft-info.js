function deleteRow(tableId, td, id) {
  var table = document.getElementById(tableId);
  table.deleteRow(td.closest("tr").rowIndex);

  var req = new XMLHttpRequest();
  req.open("GET", "/delete-spacecraft-info?id=" + id, true);
  req.addEventListener("load", function () {
    if (req.status < 200 || req.status >= 400) { console.log('error'); }
  });
  req.send(null);
}