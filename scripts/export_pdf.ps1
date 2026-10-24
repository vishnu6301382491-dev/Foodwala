$pptxPath = 'D:\FoodWala_Eclipse_Project\FoodWala_Project_Presentation.pptx'
$pdfPath = 'D:\FoodWala_Eclipse_Project\presentation\FoodWala_Project_Presentation.pdf'
$rootPdfPath = 'D:\FoodWala_Eclipse_Project\FoodWala_Project_Presentation.pdf'

try {
    $ppt = New-Object -ComObject PowerPoint.Application
    # Open presentation: Open(FileName, ReadOnly, Untitled, WithWindow)
    $presentation = $ppt.Presentations.Open($pptxPath, 2, 0, 0)
    # 32 = ppSaveAsPDF
    $presentation.SaveAs($pdfPath, 32)
    $presentation.SaveAs($rootPdfPath, 32)
    $presentation.Close()
    $ppt.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    Write-Host "✅ PDF successfully generated at: $pdfPath"
} catch {
    Write-Host "COM export error: $_"
}
