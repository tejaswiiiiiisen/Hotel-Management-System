$body = '{"floorName":"Test 99th Floor","orgId":"MA330"}'
try {
  $res = Invoke-RestMethod -Uri "http://localhost:4000/api/rooms/floors" -Method Post -Body $body -ContentType "application/json"
  Write-Output "SUCCESS:"
  Write-Output ($res | ConvertTo-Json)
} catch {
  Write-Output "FAILED:"
  Write-Output $_.Exception.Message
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Output $reader.ReadToEnd()
  }
}
