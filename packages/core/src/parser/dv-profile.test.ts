import { describe, it, expect } from 'vitest';
import { matchMultiplePatterns } from './file.js';
import { PARSE_REGEX } from './regex.js';

const visualTags = (filename: string): string[] =>
  matchMultiplePatterns(filename, PARSE_REGEX.visualTags);

describe('Dolby Vision profile detection', () => {
  it('detects Profile 7 from an explicit "DV.P7" marker on a remux', () => {
    const tags = visualTags(
      'Dune.Part.Two.2024.2160p.UHD.BluRay.REMUX.DV.P7.HDR10.HEVC.TrueHD.7.1.Atmos-FraMeSToR'
    );
    expect(tags.includes('DV'), 'still reports the base DV tag').toBe(true);
    expect(tags.includes('DV P7')).toBe(true);
    expect(!tags.includes('DV P8')).toBe(true);
    expect(!tags.includes('DV P5')).toBe(true);
  });

  it('detects Profile 7 from the FEL layer marker', () => {
    const tags = visualTags(
      'Interstellar.2014.2160p.UHD.BluRay.Remux.DoVi.FEL.HDR10.HEVC.DTS-HD.MA.5.1-3L'
    );
    expect(tags.includes('DV P7')).toBe(true);
    expect(!tags.includes('DV P8')).toBe(true);
  });

  it('detects Profile 7 from a "BL+EL" marker', () => {
    const tags = visualTags(
      'Blade.Runner.2049.2017.2160p.UHD.BluRay.REMUX.DV.BL+EL.HDR10.HEVC.TrueHD.7.1-BestHD'
    );
    expect(tags.includes('DV P7')).toBe(true);
  });

  it('detects Profile 8 on a WEB-DL release', () => {
    const tags = visualTags(
      'Shogun.S01E01.2160p.DSNP.WEB-DL.DDP5.1.Atmos.DV.P8.HDR.H.265-FLUX'
    );
    expect(tags.includes('DV P8')).toBe(true);
    expect(!tags.includes('DV P7')).toBe(true);
  });

  it('detects Profile 8 written as "Profile 8"', () => {
    const tags = visualTags(
      'The.Batman.2022.2160p.WEB-DL.DDP5.1.Atmos.DoVi.Profile.8.HDR10.H265-EVO'
    );
    expect(tags.includes('DV P8')).toBe(true);
    expect(!tags.includes('DV P7')).toBe(true);
  });

  it('detects Profile 5 and does not confuse it with 7 or 8', () => {
    const tags = visualTags(
      'Alien.Romulus.2024.2160p.AMZN.WEB-DL.DDP5.1.Atmos.DV.P5.HEVC-CMRG'
    );
    expect(tags.includes('DV P5')).toBe(true);
    expect(!tags.includes('DV P7')).toBe(true);
    expect(!tags.includes('DV P8')).toBe(true);
  });

  it('reports no profile when a DV release does not advertise one', () => {
    const tags = visualTags(
      'Oppenheimer.2023.2160p.UHD.BluRay.x265.10bit.HDR.DV.DTS-HD.MA.5.1-SWTYBLZ'
    );
    expect(tags.includes('DV')).toBe(true);
    expect(!tags.includes('DV P5')).toBe(true);
    expect(!tags.includes('DV P7')).toBe(true);
    expect(!tags.includes('DV P8')).toBe(true);
  });

  it('leaves an HDR10+ release without any DV profile tag', () => {
    const tags = visualTags(
      'Wicked.2024.2160p.WEB-DL.DDP5.1.Atmos.HDR10Plus.H.265-FLUX'
    );
    expect(tags.includes('HDR10+')).toBe(true);
    expect(!tags.some((t) => t.startsWith('DV'))).toBe(true);
  });

  it('handles a hybrid DV + HDR10 release (both tags, no profile claimed)', () => {
    const tags = visualTags(
      'Top.Gun.Maverick.2022.2160p.WEB-DL.DV.HDR10.DDP5.1.Atmos.H.265-CMRG'
    );
    expect(tags.includes('DV')).toBe(true);
    expect(tags.includes('HDR10')).toBe(true);
    expect(!tags.includes('DV P7')).toBe(true);
  });

  it('leaves a plain SDR release untouched', () => {
    const tags = visualTags(
      'The.Office.US.S03E04.1080p.WEB-DL.DD5.1.H.264-NTb'
    );
    expect(!tags.some((t) => t.startsWith('DV'))).toBe(true);
    expect(!tags.includes('HDR10')).toBe(true);
    expect(!tags.includes('HDR10+')).toBe(true);
  });

  it('does not match "p7"/"fel" appearing inside an unrelated word', () => {
    // 'Fellowship' must not trigger the FEL marker, and 'MP7x' is not 'P7'
    const tags = visualTags(
      'The.Lord.of.the.Rings.The.Fellowship.of.the.Ring.2001.2160p.BluRay.x265-MP7x'
    );
    expect(!tags.includes('DV P7')).toBe(true);
  });
});
