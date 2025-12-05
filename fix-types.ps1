$file = "c:\Users\akaye\Desktop\VOU\pages\api\articles\[slug].ts"
$lines = Get-Content -LiteralPath $file
$content = $lines -join "`n"
$oldObject = "      } = {
        title,
        content,
        excerpt,
        featured_image,
        status,
        updated_at: new Date().toISOString(),
        published_at: existingArticle.published_at
      };"
$newObject = "      } = {
        title,
        content,
        excerpt || null,
        featured_image || null,
        status,
        updated_at: new Date().toISOString(),
        published_at: existingArticle.published_at
      };"
$content = $content.Replace($oldObject, $newObject)
$content | Out-File -LiteralPath $file -Encoding UTF8
