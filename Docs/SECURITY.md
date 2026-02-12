# Security Policy

## Our Commitment

NyayaSankalan handles sensitive legal and personal information. We take security seriously and are committed to ensuring the safety of user data. This document outlines our security practices and how to report vulnerabilities.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.0.x   | :white_check_mark: | Active |
| < 1.0   | :x:                | EOL    |

## Security Measures Implemented

### Authentication & Authorization

- **JWT-based authentication** with secure token storage
- **Role-based access control (RBAC)** for Police, SHO, Court Clerk, and Judge roles
- **Organization-level isolation** - Users can only access cases from their organization
- **Password hashing** using bcrypt with salt rounds
- **Token expiration** - Access tokens expire after configurable time
- **Secure session management** - HttpOnly cookies where applicable

### Data Protection

- **Input validation** on all API endpoints using express-validator
- **SQL injection prevention** through Prisma ORM parameterized queries
- **XSS protection** - All user inputs sanitized before rendering
- **CSRF protection** - Tokens used for state-changing operations
- **Data encryption at rest** for sensitive fields (planned)
- **File upload validation** - Type, size, and content checks
- **Audit logging** - Complete trail of all data modifications

### API Security

- **Rate limiting** to prevent brute force attacks
- **CORS configuration** - Only trusted origins allowed
- **Request size limits** - Prevents DoS attacks
- **Authentication required** on all sensitive endpoints
- **Error handling** - No sensitive information in error messages
- **API versioning** for backwards compatibility

### Infrastructure Security

- **Environment variables** for sensitive configuration
- **Database credentials** never committed to version control
- **Secure headers** (Helmet.js middleware)
- **HTTPS enforcement** in production
- **Regular dependency updates** for security patches
- **PostgreSQL row-level security** (RLS) capabilities

### Privacy Compliance

- **Data minimization** - Only necessary data collected
- **Access logging** - Who accessed what and when
- **User consent** for data processing
- **Right to erasure** - Data deletion capabilities
- **Data portability** - Export user data on request
- **Anonymization** options for archived cases

## Reporting a Vulnerability

We appreciate the security community's efforts in keeping NyayaSankalan secure. If you discover a security vulnerability, please follow these guidelines:

### Where to Report

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, report security issues via:

1. **Email**: security@nyayasankalan.example.com _(Configure your actual email)_
2. **Private Security Advisory**: Use GitHub's private vulnerability reporting feature

### What to Include

When reporting a vulnerability, please provide:

- **Description** - Clear explanation of the vulnerability
- **Impact** - Who is affected and how severe is it
- **Steps to reproduce** - Detailed steps to verify the issue
- **Proof of concept** - Code or screenshots if applicable
- **Suggested fix** - If you have ideas for remediation
- **Your contact info** - For follow-up questions

### Response Timeline

We commit to:

- **Acknowledge receipt** within 48 hours
- **Initial assessment** within 5 business days
- **Regular updates** on progress every 7 days
- **Public disclosure** only after fix is deployed (coordinated disclosure)

### Severity Classification

We classify vulnerabilities using these levels:

#### Critical (CVSS 9.0-10.0)
- Remote code execution
- SQL injection allowing data exfiltration
- Authentication bypass affecting all users
- **Response time**: Immediate patch within 24-48 hours

#### High (CVSS 7.0-8.9)
- Privilege escalation across organizations
- Unauthorized access to case data
- XSS allowing session hijacking
- **Response time**: Patch within 1 week

#### Medium (CVSS 4.0-6.9)
- CSRF vulnerabilities
- Information disclosure
- Denial of service (limited scope)
- **Response time**: Patch within 2 weeks

#### Low (CVSS 0.1-3.9)
- Minor information leaks
- Issues requiring physical access
- Theoretical vulnerabilities
- **Response time**: Addressed in next release

## Security Best Practices for Deployments

If you're deploying NyayaSankalan, follow these practices:

### Environment Configuration

```bash
# Use strong secrets
JWT_SECRET=<generate-using-openssl-rand-hex-64>
DATABASE_URL=<never-commit-this>

# Enable production mode
NODE_ENV=production

# Configure CORS properly
ALLOWED_ORIGINS=https://your-domain.com

# Set secure cookie flags
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true
```

### Database Security

- Use separate database users with minimum required privileges
- Enable PostgreSQL SSL connections
- Regular backups with encryption
- Restrict database access by IP address
- Use connection pooling limits

### Server Hardening

- Keep Node.js and all dependencies updated
- Use a reverse proxy (nginx/Apache) with security headers
- Enable firewall rules (allow only necessary ports)
- Implement intrusion detection
- Regular security audits
- Log aggregation and monitoring

### File Uploads

- Scan uploaded files for malware
- Store files outside web root
- Use signed URLs with expiration
- Implement file size limits
- Validate file types server-side

### Monitoring & Logging

- Monitor for suspicious activity
- Log authentication attempts
- Alert on multiple failed logins
- Track API usage patterns
- Regular log review

## Security Checklist for Contributors

Before submitting code:

- [ ] No hardcoded credentials or secrets
- [ ] All inputs validated and sanitized
- [ ] Authentication required on sensitive endpoints
- [ ] Authorization checks for data access
- [ ] No SQL injection vulnerabilities
- [ ] XSS prevention implemented
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Environment variables for configuration
- [ ] Security headers configured

## Known Security Considerations

### Current Limitations

1. **File Storage**: Currently using Cloudinary; consider encryption for highly sensitive documents
2. **Password Recovery**: Email-based reset; consider adding 2FA
3. **Session Management**: Consider implementing session revocation
4. **Audit Logs**: Consider immutable audit log storage

### Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] End-to-end encryption for sensitive documents
- [ ] Advanced anomaly detection
- [ ] Biometric authentication support
- [ ] Hardware security module (HSM) integration
- [ ] Regular penetration testing
- [ ] Bug bounty program

## Disclosure Policy

We follow **responsible disclosure**:

1. Researcher reports vulnerability privately
2. We confirm and develop a fix
3. Fix is deployed to production
4. Public disclosure after 90 days or when fix is live (whichever comes first)
5. Researcher credited in security advisories (if desired)

## Security Hall of Fame

We recognize security researchers who help us:

<!-- List will be updated as vulnerabilities are reported and fixed -->

_No vulnerabilities reported yet. Be the first to help secure NyayaSankalan!_

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Security Guide](https://www.prisma.io/docs/guides/security)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## Contact

For security concerns:
- **Email**: security@nyayasankalan.example.com
- **PGP Key**: _(Add your PGP public key for encrypted communication)_

For general questions: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Last Updated**: December 31, 2025

Thank you for helping keep NyayaSankalan and its users safe! 🔒
