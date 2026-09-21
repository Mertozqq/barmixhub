param([string]$Filter = '*.docx')
$ErrorActionPreference='Stop'
$qa=Join-Path $PSScriptRoot 'all-qa'
New-Item -ItemType Directory -Force -Path $qa | Out-Null
$app=$null
try {
 $app=New-Object -ComObject Word.Application
 $app.Visible=$false
 $app.DisplayAlerts=0
 foreach($file in Get-ChildItem -LiteralPath $PSScriptRoot -Filter $Filter) {
  $document=$null
  try {
   $document=$app.Documents.Open($file.FullName,$false,$false)
   $document.Fields.Update() | Out-Null
   foreach($toc in $document.TablesOfContents){$toc.Update()}
   $document.Repaginate()
   foreach($paragraph in $document.Paragraphs) {
    if($paragraph.Range.Text.StartsWith('Листов ')) {
     $paragraph.Range.Text='Листов '+($document.ComputeStatistics(2)-1)+"`r"
     break
    }
   }
   $document.Fields.Update() | Out-Null
   $document.Save()
   $document.ExportAsFixedFormat((Join-Path $qa ($file.BaseName+'.pdf')),17)
   Write-Output ($file.Name+': '+$document.ComputeStatistics(2))
  } finally {if($document){$document.Close(0)}}
 }
} finally {if($app){$app.Quit()}}
