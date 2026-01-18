# Cloudflare DNS Configuration

# Get the zone ID for the domain
data "cloudflare_zone" "main" {
  name = var.cloudflare_zone_name
}

# A record for API subdomain (points to EC2 Elastic IP)
resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.main.id
  name    = "api"
  content = aws_eip.api.public_ip
  type    = "A"
  ttl     = 1  # 1 = automatic (Cloudflare proxied default)
  proxied = false  # Set to false for direct connection (needed for SSL cert)

  comment = "Konta API server - managed by Terraform"
}

# Optional: A record for root domain (for frontend if needed)
# Uncomment if you want to manage the root domain DNS here
# resource "cloudflare_record" "root" {
#   zone_id = data.cloudflare_zone.main.id
#   name    = "@"
#   content = "YOUR_NETLIFY_IP_OR_CNAME"
#   type    = "A"
#   ttl     = 1
#   proxied = true
#
#   comment = "Konta frontend - managed by Terraform"
# }

# Optional: CNAME for www subdomain
# resource "cloudflare_record" "www" {
#   zone_id = data.cloudflare_zone.main.id
#   name    = "www"
#   content = var.cloudflare_zone_name
#   type    = "CNAME"
#   ttl     = 1
#   proxied = true
#
#   comment = "Konta www redirect - managed by Terraform"
# }
