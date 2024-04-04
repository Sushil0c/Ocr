document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('imageInput');
  const languageSelect = document.getElementById('languageSelect');
  const convertBtn = document.getElementById('convertBtn');
  const statusContainer = document.getElementById('statusContainer');
  const resultContainer = document.getElementById('resultContainer');
  const copyBtn = document.querySelector('.copyBtn');

  convertBtn.addEventListener('click', () => {
    if (imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(imageInput.files[0]);

      statusContainer.textContent = "Converting image to text...";
      statusContainer.classList.remove("success", "error");

      reader.onload = () => {
        const image = new Image();
        image.src = reader.result;

        image.onload = () => {
          const selectedLanguages = Array.from(languageSelect.selectedOptions).map(option => option.value);

          // Perform OCR for each selected language
          Promise.all(selectedLanguages.map(language => performOCR(image, language)))
            .then((results) => {
              // Combine OCR results into a single string
              const ocrText = results.join('\n');
              // Extract and display tables and lists
              displayTablesAndLists(ocrText);
              statusContainer.textContent = "Conversion complete!";
              statusContainer.classList.add("success");
              copyBtn.style.display = "inline";
            })
            .catch((error) => {
              console.error('Error:', error);
              statusContainer.textContent = "An error occurred during conversion. Please try again.";
              statusContainer.classList.add("error");
              copyBtn.style.display = "none";
            });
        };
      };
    } else {
      resultContainer.textContent = "";
      statusContainer.textContent = "Please select an image file.";
      statusContainer.classList.add("error");
      copyBtn.style.display = "none";
    }
  });

  // Function to perform OCR for a specific language
  async function performOCR(image, language) {
    try {
      const result = await Tesseract.recognize(image, language, { langPath: 'https://tessdata.projectnaptha.com/4.0.0' });
      return result.data.text;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  // Function to display tables and lists from OCR text
  function displayTablesAndLists(ocrText) {
    const lines = ocrText.split('\n').map(line => line.trim());
    let tableStarted = false;
    let listStarted = false;
    let tableHTML = '';
    let listHTML = '';

    lines.forEach(line => {
      if (line) {
        if (line.startsWith('|') && line.endsWith('|')) {
          if (!tableStarted) {
            tableHTML += '<table>';
            tableStarted = true;
          }
          tableHTML += '<tr>';
          line.split('|').forEach(cell => {
            tableHTML += `<td>${cell.trim()}</td>`;
          });
          tableHTML += '</tr>';
        } else {
          if (tableStarted) {
            tableHTML += '</table><br>';
            tableStarted = false;
          }
          if (line.startsWith('-') || line.startsWith('*') || line.startsWith('+')) {
            if (!listStarted) {
              listHTML += '<ul>';
              listStarted = true;
            }
            listHTML += `<li>${line.substring(1).trim()}</li>`;
          } else {
            if (listStarted) {
              listHTML += '</ul><br>';
              listStarted = false;
            }
            resultContainer.innerHTML += `<p>${line}</p>`;
          }
        }
      }
    });

    // Append any remaining content
    if (tableStarted) {
      tableHTML += '</table>';
    }
    if (listStarted) {
      listHTML += '</ul>';
    }

    // Display tables and lists
    resultContainer.innerHTML += tableHTML;
    resultContainer.innerHTML += listHTML;
  }
});