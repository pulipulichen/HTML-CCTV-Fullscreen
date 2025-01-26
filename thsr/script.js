document.getElementById('originStation').addEventListener('change', fetchTimetable);
      document.getElementById('destinationStation').addEventListener('change', fetchTimetable);
      document.getElementById('datePicker').addEventListener('change', fetchTimetable);

      function getTomorrowDate() {
          var tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
      }

      function getTodayDate() {
          var today = new Date();
          // date.setDate(date.getDate());
          return today.toISOString().split('T')[0];
      }

      function getQueryParam(param) {
          var urlParams = new URLSearchParams(window.location.search);
          return urlParams.get(param);
      }

      function fetchStations() {
          fetch('https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/Station')
              .then(response => response.json())
              .then(data => {
                  // console.log(data)
                  let stationDropdowns = [document.getElementById('originStation'), document.getElementById('destinationStation')];
                  stationDropdowns.forEach(dropdown => {
                      data.forEach(station => {
                          let option = document.createElement('option');
                          option.value = station.StationID;
                          option.textContent = station.StationName.Zh_tw;
                          dropdown.appendChild(option);
                      });
                  });
                  document.getElementById('originStation').value = getQueryParam('origin') || '1070';
                  document.getElementById('destinationStation').value = getQueryParam('destination') || '1000';
                  $('.ui.dropdown').dropdown();
                  fetchTimetable()
              })
              .catch(error => console.error('Error fetching stations:', error));
      }

      document.addEventListener("DOMContentLoaded", function() {
          let paramData = getQueryParam('date');
          let now = new Date();
          let hours = now.getHours();

          if (!paramData) {
            if (hours < 18) {
                paramData = getTomorrowDate()    
            }
            else {
                paramData = getTodayDate()
            }
          }

          if (paramData === 'tomorrow') {
            paramData = getTomorrowDate()
          }
          if (paramData === 'today') {
            paramData = getTodayDate()
          }

          // Initial load
          document.getElementById('datePicker').value = paramData;
          fetchStations();
      });

      function fetchTimetable() {
          var selectedDate = document.getElementById('datePicker').value;
          var origin = document.getElementById('originStation').value;
          var destination = document.getElementById('destinationStation').value;
          if (!selectedDate || !origin || !destination) {
              alert('請選擇所有查詢條件');
              return;
          }
          var url = `https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/${origin}/to/${destination}/${selectedDate}`;
          
          let cachedData = sessionStorage.getItem(url)

          if (!cachedData) {
            fetch(url)
                .then(response => response.json())
                .then(data => {
                  sessionStorage.setItem(url, JSON.stringify(data));
                  return displayResults(data)
                })
                .catch(error => console.error('Error fetching data:', error));
          }
          else {
            let data = JSON.parse(cachedData);
            displayResults(data);
          }
      }
      
      function displayResults(data) {
          let resultContainerHTML = ''
          let rail = data[0]
          resultContainerHTML = `<table class="ui celled unstackable table">
<thead>
  <th>車次</th>
  <th>[${rail.OriginStopTime.StationName.Zh_tw}] 出發時間 </th>
  <th>[${rail.DestinationStopTime.StationName.Zh_tw}] 抵達時間</th>
</thead>
<tbody>`;
          let now = new Date();
          let departureTime = new Date();
          let nextTrainFound = false;
          data.forEach(train => {
              
              let timeParts = train.OriginStopTime.DepartureTime.split(":");
              departureTime.setHours(timeParts[0], timeParts[1], 0);

              if (!nextTrainFound && departureTime > now) {
                  nextTrainFound = true;
                  highlightClass = 'highlight';
              } else {
                  highlightClass = '';
              }

              let trainInfo = `
                  <tr class="${highlightClass}">
                      <td>${train.DailyTrainInfo.TrainNo}</td>
                      <td>${train.OriginStopTime.DepartureTime}</td>
                      <td>${train.DestinationStopTime.ArrivalTime}</td>
                  </tr>
              `;
              resultContainerHTML += trainInfo;
          });

          resultContainerHTML += '</tbody></table>';
          document.getElementById('results').innerHTML = resultContainerHTML;

          const highlightedElement = document.querySelector('.highlight');
          if (highlightedElement) {
              highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }