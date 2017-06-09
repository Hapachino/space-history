document.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {
  var button = document.getElementById('insert')

  button.addEventListener('click', function(event) {
    if (!document.getElementsByName("name")[0].value) { return; }

    var req = new XMLHttpRequest();
    var payload = "name=" + document.getElementsByName("name")[0].value +
      "&classification=" + document.getElementsByName("classification")[0].value +
      "&pid=" + document.getElementsByName("pid")[0].value +
      "&startDate=" + document.getElementsByName("startDate")[0].value +
      "&endDate=" + document.getElementsByName("endDate")[0].value;

    req.open("GET", "/insert-spacecraft?" + payload, true);

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

        var classification = document.createElement("td");
        classification.textContent = document.getElementsByName("classification")[0].value;
        row.appendChild(classification);

        var pid = document.createElement("td");
        var element = document.getElementsByName("pid")[0];        
        pid.textContent = document.getElementsByName("pid")[0].options[element.selectedIndex].text
        row.appendChild(pid);
        
        var startDate = document.createElement("td");
        if (document.getElementsByName("startDate")[0].value == "0000-00-00") {
          startDate.textContent = "";
        } else {
          startDate.textContent = document.getElementsByName("startDate")[0].value; 
        }
        row.appendChild(startDate);

        var endDate = document.createElement("td");
        if (!document.getElementsByName("endDate")[0].value) {
          endDate.textContent = "Ongoing";
        } else {
          endDate.textContent = document.getElementsByName("endDate")[0].value; 
        }
        row.appendChild(endDate);

        var update = document.createElement('td');
        var anchor = document.createElement('a');
        anchor.setAttribute('href', '/update?id=' + id);
        var button = document.createElement('button');
        var icon = document.createElement('span');
        icon.className += "glyphicon glyphicon-edit";
        button.appendChild(icon);
        var span = document.createElement('span');
        span.textContent = " Update";
        button.appendChild(span);
        button.className += "btn btn-default btn-sm";
        anchor.appendChild(button);
        update.appendChild(anchor);
        row.appendChild(update);

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
  req.open("GET", "/delete-spacecraft?id=" + id, true);
  req.addEventListener("load", function () {
    if (req.status < 200 || req.status >= 400) { console.log('error'); }
  });
  req.send(null);
}