document.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {
  var button = document.getElementById('insert')

  button.addEventListener('click', function(event) {
    if (!document.getElementsByName("name")[0].value) { return; }

    var req = new XMLHttpRequest();
    var payload = "name=" + document.getElementsByName("name")[0].value +
      "&country=" + document.getElementsByName("country")[0].value +
      "&startYear=" + document.getElementsByName("startYear")[0].value +
      "&endYear=" + document.getElementsByName("endYear")[0].value;

    req.open("GET", "/insert-program?" + payload, true);

    req.addEventListener('load', function (event) {
      if (req.status >= 200 && req.status < 400) {
        var error = document.getElementById("error");

        if (req.responseText == "dup") {
          error.textContent = "That name already exists.";
          error.className = "alert alert-danger";
          return;
        }
        
        error.textContent = " ";
        error.className = " ";

        var id = JSON.parse(req.responseText).insertId;
        var table = document.getElementById("table");
        var row = table.insertRow(-1);

        var name = document.createElement("td");
        name.textContent = document.getElementsByName("name")[0].value;
        row.appendChild(name);

        var country = document.createElement("td");
        country.textContent = document.getElementsByName("country")[0].value;
        row.appendChild(country);

        var startYear = document.createElement("td");
        startYear.textContent = document.getElementsByName("startYear")[0].value;
        row.appendChild(startYear);
        
        var endYear = document.createElement("td");
        endYear.textContent = document.getElementsByName("endYear")[0].value || "Ongoing" 
        row.appendChild(endYear);

        var deletion = document.createElement('td');
        var button = document.createElement('button');
        var icon = document.createElement('span');
        icon.className += "glyphicon glyphicon-remove";
        button.appendChild(icon);
        var span = document.createElement('span');
        span.textContent = " Delete";
        button.appendChild(span);
        button.setAttribute('onClick', 'deleteRow("table",' + 'this, ' + id + ')');
        button.className += "btn btn-default btn-sm";
        deletion.appendChild(button);
        row.appendChild(deletion);

        document.getElementById("insert-form").reset();
      } else {
        console.log("Error.");
      }
    })
    req.send(null);
    event.preventDefault();
  })
}

function deleteRow(tableId, td, id) {
  var table = document.getElementById(tableId);
  table.deleteRow(td.closest("tr").rowIndex);

  var req = new XMLHttpRequest();
  req.open("GET", "/delete-program?id=" + id, true);
  req.addEventListener("load", function () {
    if (req.status < 200 || req.status >= 400) { console.log('error'); }
  });
  req.send(null);
}