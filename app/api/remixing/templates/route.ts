import { NextRequest, NextResponse } from 'next/server'
import { LicenseTemplate } from '@/types/remixing'

const LICENSE_TEMPLATES: LicenseTemplate[] = [
  {
    id: 'repost',
    name: 'Repost License',
    description: 'Purchase license to repost this video as-is on your channel or platform. Perfect for sharing great content while respecting creator rights.',
    shortDescription: 'Repost video as-is',
    icon: 'Share2',
    howToUse: [
      'Purchase the repost license for the desired duration',
      'Download or link to the original video',
      'Post on your channel with proper attribution',
      'Include creator credit as specified in license terms'
    ],
    popular: true,
    configuration: {
      enabled: true,
      permissionLevel: 'basic',
      template: 'repost',
      requiresAttribution: true,
      allowCommercialUse: true,
      allowDerivatives: false,
      message: 'This license allows you to repost this video with attribution. No modifications permitted.'
    }
  },
  {
    id: 'remix',
    name: 'Remix License',
    description: 'Purchase license to create remixes by combining this content with your own original material. Great for collaborative content creation.',
    shortDescription: 'Remix with your content',
    icon: 'Shuffle',
    howToUse: [
      'Purchase the remix license for your intended use period',
      'Download the original video file',
      'Create your remix by combining with your original content',
      'Credit the original creator in your final remix',
      'Publish your remix following the license terms'
    ],
    popular: true,
    configuration: {
      enabled: true,
      permissionLevel: 'advanced',
      template: 'remix',
      requiresAttribution: true,
      allowCommercialUse: true,
      allowDerivatives: true,
      message: 'This license allows you to remix this content with your own material. Attribution required.'
    }
  },
  {
    id: 'reaction',
    name: 'Reaction License',
    description: 'Purchase license to use this video for reaction content. Perfect for reaction videos, commentary, and review content.',
    shortDescription: 'Use for reaction videos',
    icon: 'MessageCircle',
    howToUse: [
      'Purchase the reaction license',
      'Set up your recording equipment for your reaction',
      'Play the licensed video while recording your reaction',
      'Edit your reaction video with appropriate segments',
      'Credit the original creator in your reaction video'
    ],
    popular: true,
    configuration: {
      enabled: true,
      permissionLevel: 'basic',
      template: 'reaction',
      requiresAttribution: true,
      allowCommercialUse: true,
      allowDerivatives: true,
      message: 'This license allows you to use this content for reaction videos. Please provide proper attribution.'
    }
  },
  {
    id: 'custom',
    name: 'Custom License',
    description: 'Define your own specific terms and conditions for how others can use your content.',
    shortDescription: 'Define your own terms',
    icon: 'Settings',
    howToUse: [
      'Set your own custom licensing terms',
      'Define specific use cases and restrictions',
      'Set pricing and duration for your custom license',
      'Users will need to follow your custom terms exactly'
    ],
    configuration: {
      enabled: true,
      permissionLevel: 'custom',
      template: 'custom',
      requiresAttribution: true,
      allowCommercialUse: false,
      allowDerivatives: true,
      message: 'Please review my custom licensing terms before use.'
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const popularOnly = searchParams.get('popular') === 'true'
    
    let templates = LICENSE_TEMPLATES
    
    if (popularOnly) {
      templates = templates.filter(t => t.popular)
    }
    
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error) {
    console.error('Error fetching license templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch license templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, customization } = body
    
    // Find the base template
    const baseTemplate = LICENSE_TEMPLATES.find(t => t.id === templateId)
    if (!baseTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Apply customizations
    const customizedTemplate = {
      ...baseTemplate,
      configuration: {
        ...baseTemplate.configuration,
        ...customization
      }
    }
    
    return NextResponse.json({
      success: true,
      template: customizedTemplate
    })
  } catch (error) {
    console.error('Error customizing remixing template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to customize template' },
      { status: 500 }
    )
  }
}