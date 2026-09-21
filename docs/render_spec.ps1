$ErrorActionPreference = 'Stop'
$specInput = Join-Path $PSScriptRoot 'ТЗ_BarMixHub.docx'
$specOutput = Join-Path $PSScriptRoot 'spec-qa/ТЗ_BarMixHub.pdf'
$wordApp = $null
$wordDoc = $null
try {
    $wordApp = New-Object -ComObject Word.Application
    $wordApp.Visible = $false
    $wordApp.DisplayAlerts = 0
    $wordDoc = $wordApp.Documents.Open($specInput, $false, $true)
    $wordDoc.Repaginate()
    Write-Output "Pages: $($wordDoc.ComputeStatistics(2))"
    $wordDoc.ExportAsFixedFormat($specOutput, 17)
} finally {
    if ($wordDoc) { $wordDoc.Close(0) }
    if ($wordApp) { $wordApp.Quit() }
}
