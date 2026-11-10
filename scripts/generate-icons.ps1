Add-Type -AssemblyName System.Drawing
foreach ($size in @(192,512)) {
  $bmp = [System.Drawing.Bitmap]::new($size,$size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(16,24,39))
  $scale = $size / 512.0
  $points = @(
    [System.Drawing.PointF]::new([float](101*$scale),[float](282*$scale)),
    [System.Drawing.PointF]::new([float](196*$scale),[float](282*$scale)),
    [System.Drawing.PointF]::new([float](241*$scale),[float](171*$scale)),
    [System.Drawing.PointF]::new([float](302*$scale),[float](341*$scale)),
    [System.Drawing.PointF]::new([float](345*$scale),[float](258*$scale)),
    [System.Drawing.PointF]::new([float](412*$scale),[float](258*$scale))
  )
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(184,239,121),[float](30*$scale))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $g.DrawLines($pen,$points)
  $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(184,239,121)),[float](396*$scale),[float](240*$scale),[float](36*$scale),[float](36*$scale))
  $bmp.Save((Join-Path $PSScriptRoot "..\public\icon-$size.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $pen.Dispose(); $g.Dispose(); $bmp.Dispose()
}
