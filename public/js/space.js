document.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {
  var button = document.getElementById('insert')

  button.addEventListener('click', function (event) {
    if (!document.getElementsByName("name")[0].value) { return; }

    var req = new XMLHttpRequest();
    var payload = "name=" + document.getElementsByName("name")[0].value +
      "&classification=" + document.getElementsByName("classification")[0].value +
      "&diameter=" + document.getElementsByName("diameter")[0].value +
      "&mass=" + document.getElementsByName("mass")[0].value +
      "&au=" + document.getElementsByName("au")[0].value +
      "&moons=" + document.getElementsByName("moons")[0].value +
      "&orbits=" + document.getElementsByName("orbits")[0].value;

    req.open("GET", "/insert-space?" + payload, true);

    req.addEventListener('load', function (event) {
      if (req.status >= 200 && req.status < 400) {
        var error = document.getElementById("error");

        if (req.responseText == "dup") {
          error.textContent = "That name already exists.";
          error.className = "alert alert-danger";
          document.getElementById("insert-form").reset();
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

        var diameter = document.createElement("td");
        diameter.textContent = document.getElementsByName("diameter")[0].value;
        row.appendChild(diameter);

        var mass = document.createElement("td");
        mass.textContent = document.getElementsByName("mass")[0].value;
        row.appendChild(mass);

        var au = document.createElement("td");
        au.textContent = document.getElementsByName("au")[0].value;
        row.appendChild(au);

        var moons = document.createElement("td");
        moons.textContent = document.getElementsByName("moons")[0].value;
        row.appendChild(moons);

        var orbits = document.createElement("td");
        var element = document.getElementsByName("orbits")[0]; 
        orbits.textContent = document.getElementsByName("orbits")[0].options[element.selectedIndex].text;
        row.appendChild(orbits);

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

        if (classification.textContent) {
          var filter = document.getElementById("filter");

          for (i = 0; i < filter.options.length; ++i) {
            if (classification.textContent == filter.options[i].value) { return; }
          };

          var option = document.createElement("option");
          option.text = classification.textContent;
          option.value = classification.textContent;
          filter.appendChild(option);
        }
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
  req.open("GET", "/delete-space?id=" + id, true);
  req.addEventListener("load", function () {
    if (req.status < 200 || req.status >= 400) { console.log('error'); }
  });
  req.send(null);
}