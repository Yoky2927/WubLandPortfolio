# PowerShell script to check if a file exists
param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

Write-Host "`n=== File Existence Checker ===" -ForegroundColor Cyan
Write-Host "Checking file: $FilePath" -ForegroundColor Yellow

if (Test-Path -Path $FilePath -PathType Leaf) {
    Write-Host "✅ File EXISTS!" -ForegroundColor Green
    Write-Host "Location: $(Resolve-Path $FilePath)" -ForegroundColor Green
    
    # Get file info
    $fileInfo = Get-Item $FilePath
    Write-Host "`nFile Details:" -ForegroundColor Cyan
    Write-Host "Name: $($fileInfo.Name)"
    Write-Host "Size: $($fileInfo.Length) bytes"
    Write-Host "Last Modified: $($fileInfo.LastWriteTime)"
    Write-Host "Extension: $($fileInfo.Extension)"
} else {
    Write-Host "❌ File DOES NOT EXIST!" -ForegroundColor Red
    
    # Check if parent directory exists
    $parentDir = Split-Path $FilePath -Parent
    if (Test-Path -Path $parentDir -PathType Container) {
        Write-Host "Parent directory exists: $parentDir" -ForegroundColor Yellow
        
        # Show what's in the directory
        Write-Host "`nContents of directory:" -ForegroundColor Cyan
        Get-ChildItem -Path $parentDir | Select-Object Name, Extension, Length, LastWriteTime | Format-Table -AutoSize
    } else {
        Write-Host "Parent directory also doesn't exist: $parentDir" -ForegroundColor Red
    }
    
    # Suggest similar files
    $searchDir = Split-Path $FilePath -Parent
    $fileName = Split-Path $FilePath -Leaf
    if (Test-Path -Path $searchDir -PathType Container) {
        Write-Host "`nLooking for similar files..." -ForegroundColor Cyan
        $similarFiles = Get-ChildItem -Path $searchDir -File | Where-Object { 
            $_.Name -like "*$($fileName.Split('.')[0])*" 
        }
        
        if ($similarFiles.Count -gt 0) {
            Write-Host "Found similar files:" -ForegroundColor Yellow
            $similarFiles | ForEach-Object {
                Write-Host "  - $($_.Name)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host "`n=== Check Complete ===" -ForegroundColor Cyan