document.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {
  var button = document.getElementById('insert')

  button.addEventListener('click', function(event) {
    if (!document.getElementsByName("model")[0].value) { return; }

    var req = new XMLHttpRequest();
    var payload = "model=" + document.getElementsByName("model")[0].value +
      "&height=" + document.getElementsByName("height")[0].value +
      "&stages=" + document.getElementsByName("stages")[0].value +
      "&thrust=" + document.getElementsByName("thrust")[0].value;

    req.open("GET", "/insert-rocket?" + payload, true);

    req.addEventListener('load', function (event) {
      if (req.status >= 200 && req.status < 400) {
        var error = document.getElementById("error");

        if (req.responseText == "dup") {
          error.textContent = "That model already exists.";
          error.className = "alert alert-danger";
          return;
        }
        
        error.textContent = " ";
        error.className = " ";

        var id = JSON.parse(req.responseText).insertId;
        var table = document.getElementById("table");
        var row = table.insertRow(-1);

        var model = document.createElement("td");
        model.textContent = document.getElementsByName("model")[0].value;
        row.appendChild(model);

        var height = document.createElement("td");
        height.textContent = document.getElementsByName("height")[0].value;
        row.appendChild(height);

        var stages = document.createElement("td");
        stages.textContent = document.getElementsByName("stages")[0].value;
        row.appendChild(stages);
        
        var thrust = document.createElement("td");
        thrust.textContent = document.getElementsByName("thrust")[0].value; 
        row.appendChild(thrust);

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
  req.open("GET", "/delete-rocket?id=" + id, true);
  req.addEventListener("load", function () {
    if (req.status < 200 || req.status >= 400) { console.log('error'); }
  });
  req.send(null);
}