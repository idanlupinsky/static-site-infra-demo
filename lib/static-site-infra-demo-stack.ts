import { Construct } from 'constructs';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';


export class StaticSiteInfraDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const domainName = "example.com";

    const assetsBucket = new s3.Bucket(this, 'WebsiteBucket', {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      accessControl: s3.BucketAccessControl.PRIVATE,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity');

    assetsBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [assetsBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    }));

    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName: domainName });

    const certificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate',
      {
        domainName: domainName,
        hostedZone: zone,
        region: 'us-east-1', // Cloudfront only checks this region for certificates.
      });

    // Add a cloudfront Function to a Distribution
    const rewriteFunction = new cloudfront.Function(this, 'Function', {
      code: cloudfront.FunctionCode.fromFile({ filePath: 'functions/url-rewrite.js' }),
    });

    const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersResponseHeaderPolicy', {
      comment: 'Security headers response header policy',
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          override: true,
          contentSecurityPolicy: "default-src 'self'"
        },
        strictTransportSecurity: {
          override: true,
          accessControlMaxAge: Duration.days(2 * 365),
          includeSubdomains: true,
          preload: true
        },
        contentTypeOptions: {
          override: true
        },
        referrerPolicy: {
          override: true,
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
        },
        xssProtection: {
          override: true,
          protection: true,
          modeBlock: true
        },
        frameOptions: {
          override: true,
          frameOption: cloudfront.HeadersFrameOption.DENY
        }
      }
    });

    const cloudfrontDistribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      certificate: certificate,
      domainNames: [domainName],
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(assetsBucket, {
          originAccessIdentity: cloudfrontOriginAccessIdentity
        }),
        functionAssociations: [{
          function: rewriteFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
        }],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: responseHeaderPolicy
      },
    });

    new route53.ARecord(this, 'ARecord', {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(cloudfrontDistribution)),
      zone
    });
  }
}
