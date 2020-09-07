const MIN_BIN_SIZE = 0.0005;

export class DataBinner {

    adjustFragmentEnds(genomeLength, displayedChromosomes, chromosome, elementStart, elementEnd): Number[] {     //extend this to merge elements to minimise the required drawing
    let startValue: number = Number(elementStart);
    let endValue: number = Number(elementEnd);
    let sequenceLength = -1;
    //get length of relevant fragment
    for (let i = 0; i < displayedChromosomes.length; i++) {
        if (displayedChromosomes[i][0] === chromosome) {
            sequenceLength = displayedChromosomes[i][1]; //length of chromosome to which element belongs
            break;
        }
    }

    if (sequenceLength == -1) {
        //this is likely to be caused by using mismatched files and ideally user should be warned
        return [0, 0];
    }

    let targetLength: number = genomeLength * MIN_BIN_SIZE;
    if (targetLength > sequenceLength) {
        //the genome element is less than 1% of total genome length, so should be coloured in its entirety
        return [0, sequenceLength]
    }


    if ((endValue - startValue) < (targetLength)) {
        //fragment is less then 1% of element length, increase the lenght of fragment
        if (endValue + targetLength / 2 <= sequenceLength && startValue - targetLength / 2 >= 0) {
            //there is enough space to increase fragment symmetrically
            startValue += -targetLength / 2; //note minus sign
            endValue += targetLength / 2;
        } else if (endValue + targetLength / 2 >= sequenceLength) {
            //there is not enough space to increase the end of sequence
            startValue += -(targetLength / 2 + (sequenceLength - (endValue + targetLength / 2)));
            endValue = sequenceLength;
        } else if (startValue - targetLength / 2 <= 0) {
            endValue += (targetLength / 2 - (startValue - targetLength / 2));
            startValue = 0;
        }
    }

    return [startValue, endValue];
}

    mergeBins(mergedSequences, elementID, start, end, color) {

    if (mergedSequences.length === 0) {
        //special case - dislapyedSequences contains no items
        mergedSequences.push({ chr: elementID, start: start, end: end, color: color });
        return;
    }

//because all the sequence are binned together the array doesn't need to be sorted. 
//the possible cases are (first line is existing sequence):
//case 1
//    __________
// ______
//case 2
//    ______
// ______________
//case 3 
// ________
//     _______
//case 4
// ______________
//    ________
//case 5
// ______
//         ______
//case 6
//         ______
// ______

let overlapCase = 5; //assume by default that element doesn't overlap with anything
let i = 0;
for (i = 0; i < mergedSequences.length; i++) {
    if (mergedSequences[i].chr === elementID) {
        if (mergedSequences[i].start <= start) {
            //either 3 or 4 or 5
            if (mergedSequences[i].end >= end) {
                //case 4, new sequence is contained within this one
                overlapCase = 4;
                break;
            } else if (mergedSequences[i].end < start) {
                //case 5, new sequence doesn't overlap with this one, do nothing
                overlapCase = 5; //break is not needed as there may be other sequences with overlap with new
            } else {
                //case 3, extend existing sequence to the end of new one and exit
                overlapCase = 3;
                break;
            }
        } else {
            //either 1 or 2 or 6
            if (mergedSequences[i].end <= end) {
                //case 2, this sequence contain existing one
                overlapCase = 2;
                break;
            } else if (mergedSequences[i].start >= end) {
                //case 6, new sequence doesn't overlap with this one, do nothing
                overlapCase = 6; //break is not needed as there may be other sequences with overlap with new
            } else {
                //case 1, extend this sequence to the beginning of new one
                overlapCase = 1;
                break;
            }
        }
    }
}

    switch (overlapCase) {
        case 1: //extend existing to the left
            mergedSequences[i].start = start;
            break;
        case 2: //replace existing with new
            mergedSequences[i].start = start;
            mergedSequences[i].end = end;
            break;
        case 3: //extend existing to the right
            mergedSequences[i].end = end;
            break;
        case 4: //do nothing
            break;
        case 5: //add new as new fragment
            mergedSequences.push({ chr: elementID, start: start, end: end, color: color });
            break;
        case 6: //add new as new fragment
            mergedSequences.push({ chr: elementID, start: start, end: end, color: color });
            break;
    }

}

    calculateDisplayedGenomeLength(displayedSequences) {
    let totalLength = 0;
    for (let i = 0; i < displayedSequences.length; i++) {
        totalLength += displayedSequences[i][1];
    }

    return totalLength;
}

}
