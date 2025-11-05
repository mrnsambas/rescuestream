# Security Policy

## Supported Versions

Currently supported versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Assumptions

### Smart Contracts

1. **RescueHelper.sol**:
   - Assumes `onlyOwner` access control is sufficient for rescue operations
   - Assumes `maxTopUpDelta` provides adequate protection against excessive top-ups
   - Assumes `ReentrancyGuard` prevents reentrancy attacks
   - **CRITICAL**: This is a demo/prototype. DO NOT use on mainnet without comprehensive audit.

2. **LendingAdapter.sol**:
   - Assumes owner and helper addresses are trusted
   - No validation on position data (collateral/debt values)
   - Event emissions are not validated for correctness

### Relayer

1. **Price Oracle**:
   - Falls back to static prices if Chainlink/DEX oracles fail
   - No signature verification for oracle prices
   - Circuit breaker opens after 5 consecutive failures

2. **Bot Automation**:
   - Requires private key in environment (MUST be secured)
   - Rate limiting prevents excessive rescues
   - No multi-signature support

### Frontend

1. **Wallet Integration**:
   - Uses RainbowKit/Wagmi (standard libraries)
   - No transaction simulation before execution
   - No slippage protection

2. **Data Validation**:
   - Client-side validation only
   - No server-side validation of position data

## Known Limitations

1. **No Oracle Aggregation**: Uses single price source (Chainlink or DEX), not multiple oracles aggregated
2. **No Time-locks**: Bot configuration changes take effect immediately
3. **No Emergency Pause**: Contracts don't have pause functionality
4. **Limited Access Control**: Only owner/helper can modify positions
5. **No Rate Limiting on Contract**: Contract-level rate limiting not implemented

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security concerns to: [security contact if available]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Checklist for Production

Before deploying to mainnet:

- [ ] Comprehensive smart contract audit by reputable firm
- [ ] Multi-signature wallet for contract owner
- [ ] Time-locks on critical functions
- [ ] Emergency pause mechanism
- [ ] Oracle aggregation (multiple price sources)
- [ ] Rate limiting on contract level
- [ ] Gas optimization review
- [ ] Formal verification of critical functions
- [ ] Bug bounty program
- [ ] Insurance coverage
- [ ] Incident response plan

## Disclaimer

**THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. USE AT YOUR OWN RISK. THIS IS A DEMONSTRATION PROJECT AND SHOULD NOT BE USED IN PRODUCTION WITHOUT COMPREHENSIVE SECURITY AUDITS.**

