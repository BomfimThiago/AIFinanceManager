#!/usr/bin/env python3
"""Debug script to test the API response structure."""

import asyncio
import json
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

async def test_api_response():
    """Test the actual API response that would be sent to frontend."""
    from src.shared.dependencies import get_db
    from src.integrations.repository import IntegrationRepository
    from src.integrations.institution_repository import BelvoInstitutionRepository
    from src.integrations.router import integration_to_dict
    from src.integrations.schemas import IntegrationFilter
    from src.integrations.service import IntegrationService
    
    print("🔍 Testing API response structure...")
    
    # Get database session
    async for db in get_db():
        repo = IntegrationRepository(db)
        institution_repo = BelvoInstitutionRepository(db)
        service = IntegrationService(repo)
        
        # Create filter for Belvo integrations (mimics get_belvo_integrations endpoint)
        filters = IntegrationFilter(
            provider="belvo",
            status=None,
            institution_id=None,
            institution_country=None,
            sync_frequency=None,
            auto_sync_enabled=None,
            webhook_enabled=None,
            has_errors=None,
            last_sync_before=None,
            last_sync_after=None,
            created_after=None,
            created_before=None
        )
        
        # Get integrations for user 1
        integrations = await service.get_user_integrations(1, filters)
        print(f"Found {len(integrations)} integrations for user 1")
        
        # Format integrations with institution metadata (exactly like the endpoint)
        formatted_integrations = []
        
        for integration in integrations:
            integration_dict = integration_to_dict(integration)
            
            print(f"\n📋 Processing integration {integration.id}:")
            print(f"   Institution ID: {integration.institution_id}")
            print(f"   Institution Name: {integration.institution_name}")
            
            # Look up institution metadata if we have institution_id
            if integration.institution_id:
                try:
                    institution_id_str = str(integration.institution_id)
                    print(f"   Institution ID String: '{institution_id_str}'")
                    print(f"   Is digit: {institution_id_str.isdigit()}")
                    
                    if institution_id_str.isdigit():
                        belvo_id = int(institution_id_str)
                        db_institution = await institution_repo.get_by_belvo_id(belvo_id)
                        print(f"   Searched by Belvo ID {belvo_id}")
                    else:
                        db_institution = await institution_repo.get_by_code(institution_id_str)
                        print(f"   Searched by code '{institution_id_str}'")
                    
                    if db_institution:
                        # Add institution metadata to the response
                        integration_dict["metadata"] = {
                            "belvo_id": db_institution.belvo_id,
                            "display_name": db_institution.display_name,
                            "name": db_institution.name,
                            "code": db_institution.code,
                            "type": db_institution.type,
                            "status": db_institution.status,
                            "country_code": db_institution.country_code,
                            "country_codes": db_institution.country_codes,
                            "primary_color": db_institution.primary_color,
                            "logo": db_institution.logo,
                            "icon_logo": db_institution.icon_logo,
                            "text_logo": db_institution.text_logo,
                            "website": db_institution.website,
                        }
                        print(f"   ✅ Added metadata!")
                        print(f"      Logo: {db_institution.logo}")
                        print(f"      Icon Logo: {db_institution.icon_logo}")
                        print(f"      Display Name: {db_institution.display_name}")
                    else:
                        integration_dict["metadata"] = {}
                        print(f"   ❌ Institution not found in database")
                        
                except (ValueError, TypeError) as e:
                    print(f"   ❌ Error parsing institution_id: {e}")
                    integration_dict["metadata"] = {}
            else:
                integration_dict["metadata"] = {}
            
            formatted_integrations.append(integration_dict)
        
        # Create the final API response
        api_response = {
            "integrations": formatted_integrations,
            "total": len(formatted_integrations)
        }
        
        print(f"\n🎯 Final API Response Structure:")
        print(f"   Total integrations: {api_response['total']}")
        
        if formatted_integrations:
            print(f"\n📄 Sample Integration JSON:")
            sample = formatted_integrations[0]
            
            # Show the relevant fields for logo display
            relevant_fields = {
                "id": sample.get("id"),
                "institution_name": sample.get("institution_name"),
                "institution_logo_url": sample.get("institution_logo_url"),
                "metadata": sample.get("metadata", {})
            }
            
            print(json.dumps(relevant_fields, indent=2))
            
            print(f"\n🖼️  Logo Analysis:")
            metadata = sample.get("metadata", {})
            print(f"   metadata exists: {bool(metadata)}")
            print(f"   metadata.logo: {metadata.get('logo')}")
            print(f"   metadata.icon_logo: {metadata.get('icon_logo')}")
            print(f"   metadata.text_logo: {metadata.get('text_logo')}")
            print(f"   metadata.display_name: {metadata.get('display_name')}")
            
            # Test the frontend logic
            print(f"\n🔧 Frontend Logo Logic Test:")
            logo = metadata.get('logo') or metadata.get('icon_logo') or metadata.get('text_logo')
            print(f"   Final logo URL: {logo}")
            print(f"   Would show logo: {bool(logo)}")
        else:
            print("   No integrations to display")
        
        break

if __name__ == "__main__":
    asyncio.run(test_api_response())